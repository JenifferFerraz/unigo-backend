import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { ExternalRoute } from '../entities/ExternalRoute';
import { Room } from '../entities/Room';
import { Structure } from '../entities/Structure';
import { In } from 'typeorm';
import { haversine } from './internalRoutePathfinding';

export type RouteMode = 'walking' | 'driving';

export interface UnifiedRouteSegment {
  type: 'external' | 'internal' | 'transition';
  mode: RouteMode;
  path: number[][];
  floor?: number;
  distance: number;
  description: string;
}

export interface UnifiedRouteResponse {
  segments: UnifiedRouteSegment[];
  totalDistance: number;
  estimatedTime: number;
  destination?: number;
  summary: {
    externalDistance: number;
    internalDistance: number;
    floorsTraversed: number[];
  };
  structure?: any;
  roomsByFloor?: { [floor: number]: any[] };
}

interface StairConnection {
  floorA: number;
  floorB: number;
  pointOnFloorA: number[];
  pointOnFloorB: number[];
  distance: number;
  type: 'stairs' | 'level_passage';
}

export class UnifiedRouteService {
  private internalRouteRepo = AppDataSource.getRepository(InternalRoute);
  private externalRouteRepo = AppDataSource.getRepository(ExternalRoute);
  private roomRepo = AppDataSource.getRepository(Room);
  private structureRepo = AppDataSource.getRepository(Structure);

  async calculateCompleteRoute(
    userPosition: number[],
    destinationRoomId: number,
    mode: RouteMode = 'walking'
  ): Promise<UnifiedRouteResponse | null> {
   
    const destinationRoom = await this.roomRepo.findOne({
      where: { id: destinationRoomId },
      relations: ['structure']
    });

    if (!destinationRoom) {
      console.error('❌ Sala não encontrada');
      return null;
    }

    const structureId = destinationRoom.structure.id;
    const destinationFloor = destinationRoom.floor;
    const destinationCoords = this.extractCoordinates(destinationRoom.centroid);

    if (!destinationCoords) {
      console.error('❌ Coordenadas do destino inválidas');
      return null;
    }

    const segments: UnifiedRouteSegment[] = [];
    let totalDistance = 0;
    const floorsTraversed: number[] = [];

    let nearestDoor = await this.findNearestStructureDoor(structureId, userPosition, undefined, true);

    if (!nearestDoor) {
      console.warn('⚠️ Nenhuma entrada principal encontrada, buscando porta secundária...');
      nearestDoor = await this.findNearestStructureDoor(structureId, userPosition, undefined, false);
    }

    if (!nearestDoor) {
      console.error('❌ Nenhuma entrada encontrada para a estrutura');
      return null;
    }

    const entryPoint = nearestDoor.coordinates;
    const entryFloor = nearestDoor.floor;
    const isMainEntrance = nearestDoor.isMainEntrance;

    const externalDistance = haversine(userPosition, entryPoint);

    const externalPath = await this.calculateExternalRoute(
      userPosition,
      entryPoint,
      mode
    );

    if (externalPath && externalPath.length > 0) {
      const segmentDistance = this.calculatePathDistance(externalPath);
      segments.push({
        type: 'external',
        mode,
        path: externalPath,
        distance: segmentDistance,
        description: mode === 'driving'
          ? `Dirigir até a ${isMainEntrance ? 'entrada principal' : 'porta'} (${segmentDistance.toFixed(0)}m)`
          : `Caminhar até a ${isMainEntrance ? 'entrada principal' : 'porta'} (${segmentDistance.toFixed(0)}m)`
      });
      totalDistance += segmentDistance;
    } else {
      segments.push({
        type: 'external',
        mode,
        path: [userPosition, entryPoint],
        distance: externalDistance,
        description: `Ir até a ${isMainEntrance ? 'entrada principal' : 'porta'} (${externalDistance.toFixed(0)}m, linha reta)`
      });
      totalDistance += externalDistance;
    }

    const internalRouteResult = await this.calculateInternalRouteMultiFloor(
      structureId,
      entryFloor,
      entryPoint,
      destinationFloor,
      destinationCoords
    );

    if (!internalRouteResult) {
      console.error('❌ Não foi possível calcular a rota interna');
      return null;
    }

    for (const floorSegment of internalRouteResult.segments) {
      segments.push(floorSegment);
      totalDistance += floorSegment.distance;

      if (floorSegment.floor !== undefined && !floorsTraversed.includes(floorSegment.floor)) {
        floorsTraversed.push(floorSegment.floor);
      }

      if (floorSegment.type === 'transition') {
        const match = floorSegment.description.match(/Andar (\d+) → (\d+)/);
        if (match) {
          const fromFloor = parseInt(match[1]);
          const toFloor = parseInt(match[2]);
          if (!floorsTraversed.includes(fromFloor)) floorsTraversed.push(fromFloor);
          if (!floorsTraversed.includes(toFloor)) floorsTraversed.push(toFloor);
        }
      }
    }

    const walkingSpeed = 1.4;
    const drivingSpeed = 8.3;

    let estimatedTime = 0;
    for (const segment of segments) {
      const speed = segment.mode === 'driving' ? drivingSpeed : walkingSpeed;
      estimatedTime += segment.distance / speed;
    }
    estimatedTime = estimatedTime / 60;

    const structure = await this.structureRepo.findOne({
      where: { id: structureId }
  
    });

    const allFloorsSet = new Set<number>([entryFloor, destinationFloor, ...floorsTraversed]);
    for (const segment of segments) {
      if (segment.floor !== undefined) allFloorsSet.add(segment.floor);
      if (segment.type === 'transition') {
        const match = segment.description.match(/Andar (\d+) → (\d+)/);
        if (match) {
          allFloorsSet.add(parseInt(match[1]));
          allFloorsSet.add(parseInt(match[2]));
        }
      }
    }

    const allFloors = Array.from(allFloorsSet).sort((a, b) => a - b);

    // ✅ CORREÇÃO PRINCIPAL: Remover select e usar query builder
    console.log('🔍 Buscando rooms para andares:', allFloors);
    
    const rooms = await this.roomRepo
      .createQueryBuilder('room')
      .where('room.structureId = :structureId', { structureId })
      .andWhere('room.floor IN (:...floors)', { floors: allFloors })
      .getMany();

    console.log(`✅ Total de rooms encontradas: ${rooms.length}`);
    
    // Log para debug - ver quais rooms têm geometria
    rooms.forEach(room => {
      const hasGeometry = room.geometry ? '✅' : '❌';
      const hasCentroid = room.centroid ? '✅' : '❌';
      console.log(`   Room: ${room.name}, Andar: ${room.floor}, Geo: ${hasGeometry}, Centroid: ${hasCentroid}`);
    });

    const roomsByFloor: { [floor: number]: any[] } = {};
    for (const floor of allFloors) {
      roomsByFloor[floor] = rooms.filter(r => r.floor === floor);
    }

    const structureWithFilteredFloors = structure ? {
      ...structure,
      floors: allFloors
    } : structure;

    const externalDist = segments
      .filter(s => s.type === 'external')
      .reduce((sum, s) => sum + s.distance, 0);

    const internalDist = segments
      .filter(s => s.type === 'internal')
      .reduce((sum, s) => sum + s.distance, 0);

    return {
      segments,
      totalDistance,
      estimatedTime,
      destination: destinationRoomId,
      summary: {
        externalDistance: externalDist,
        internalDistance: internalDist,
        floorsTraversed: floorsTraversed.sort((a, b) => a - b)
      },
      structure: structureWithFilteredFloors,
      roomsByFloor
    };
  }


  private async findNearestStructureDoor(
    structureId: number,
    position: number[],
    floor?: number,
    mainEntranceOnly: boolean = false
  ): Promise<{ coordinates: number[]; floor: number; distance: number; isMainEntrance: boolean } | null> {
    
    const whereClause: any = {
      structure: { id: structureId }
    };

    if (floor !== undefined) {
      whereClause.floor = floor;
    }

    const doorRoutes = await this.internalRouteRepo.find({
      where: whereClause
    });

    let minDistanceMain = Infinity;
    let nearestMainDoor: { coordinates: number[]; floor: number; distance: number; isMainEntrance: boolean } | null = null;

    let minDistanceAny = Infinity;
    let nearestAnyDoor: { coordinates: number[]; floor: number; distance: number; isMainEntrance: boolean } | null = null;

    let mainEntranceCount = 0;
    let secondaryDoorCount = 0;

    for (const route of doorRoutes) {
      if (!route.properties?.isDoor) continue;
      if (!route.geometry?.coordinates) continue;

      const isMainEntrance = route.properties['In/Out'] === true;
      
      if (isMainEntrance) mainEntranceCount++;
      else secondaryDoorCount++;

      // 🔥 CRÍTICO: Se está buscando SOMENTE entrada principal, ignorar portas secundárias
      if (mainEntranceOnly && !isMainEntrance) continue;

      const lines = route.geometry.coordinates;

      for (const line of lines) {
        for (const point of line) {
          const distance = haversine(position, point);

          if (isMainEntrance && distance < minDistanceMain) {
            minDistanceMain = distance;
            nearestMainDoor = {
              coordinates: point,
              floor: route.floor,
              distance,
              isMainEntrance: true
            };
          }

          if (distance < minDistanceAny) {
            minDistanceAny = distance;
            nearestAnyDoor = {
              coordinates: point,
              floor: route.floor,
              distance,
              isMainEntrance: isMainEntrance
            };
          }
        }
      }
    }

  
    if (mainEntranceOnly) {
      if (nearestMainDoor) {
        return nearestMainDoor;
      }
      return null;
    }

    if (nearestMainDoor) {
      return nearestMainDoor;
    }

    if (nearestAnyDoor) {
      return nearestAnyDoor;
    }

    console.error('   ❌ Nenhuma porta encontrada!');
    return null;
  }

  private async calculateExternalRoute(
    start: number[],
    end: number[],
    mode: RouteMode
  ): Promise<number[][]> {
    const allRoutes = await this.externalRouteRepo.find();

    if (allRoutes.length === 0) {
      return [start, end];
    }

    const TOLERANCE = 10000;

    const unifiedPath = this.findShortestExternalPathUnified(
      allRoutes,
      start,
      end,
      TOLERANCE,
      mode
    );

    if (unifiedPath.length > 2) {
      return unifiedPath;
    }

    return [start, end];
  }

  private findShortestExternalPathUnified(
    routes: ExternalRoute[],
    start: number[],
    end: number[],
    tolerance: number,
    preferredMode: RouteMode
  ): number[][] {
    if (routes.length === 0) return [start, end];

    const graph = this.buildWeightedGraph(routes, preferredMode);
    if (Object.keys(graph).length === 0) return [start, end];

    const startKey = this.findNearestGraphNode(graph, start, tolerance);
    const endKey = this.findNearestGraphNode(graph, end, tolerance);

    if (!startKey || !endKey) return [start, end];

    const graphPath = this.dijkstra(graph, startKey, endKey);
    if (graphPath.length === 0) return [start, end];

    const fullPath = this.reconstructFullPath(routes, graphPath);

    const result: number[][] = [];
    if (fullPath.length > 0) {
      const distToFirst = haversine(start, fullPath[0]);
      if (distToFirst > 5) result.push([...start]);
    }

    result.push(...fullPath);

    if (fullPath.length > 0) {
      const distToLast = haversine(end, fullPath[fullPath.length - 1]);
      if (distToLast > 5) result.push([...end]);
    }

    return result;
  }

  private buildWeightedGraph(
    routes: ExternalRoute[],
    preferredMode: RouteMode
  ): Record<string, Record<string, number>> {
    const graph: Record<string, Record<string, number>> = {};
    const NORMALIZATION = 0.5;
    const INTERSECTION = 5;

    const DRIVING_WEIGHT = preferredMode === 'driving' ? 1.0 : 3.0;
    const WALKING_WEIGHT = preferredMode === 'driving' ? 2.0 : 1.0;

    const pointMap = new Map<string, string>();
    const allRawPoints: number[][] = [];

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;
      for (const line of route.geometry.coordinates) {
        for (const point of line) {
          allRawPoints.push(point);
        }
      }
    }

    for (let i = 0; i < allRawPoints.length; i++) {
      const pointA = allRawPoints[i];
      const keyA = pointA.join(',');

      if (pointMap.has(keyA)) continue;

      for (let j = i + 1; j < allRawPoints.length; j++) {
        const pointB = allRawPoints[j];
        const distance = haversine(pointA, pointB);

        if (distance < NORMALIZATION) {
          const keyB = pointB.join(',');
          pointMap.set(keyB, keyA);
        }
      }

      pointMap.set(keyA, keyA);
    }

    const getNormalizedKey = (point: number[]): string => {
      const key = point.join(',');
      return pointMap.get(key) || key;
    };

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;

      const isDriving = route.properties?.mode === 'driving';
      const weight = isDriving ? DRIVING_WEIGHT : WALKING_WEIGHT;

      const lines = route.geometry.coordinates;
      for (const line of lines) {
        for (let i = 0; i < line.length - 1; i++) {
          const a = line[i];
          const b = line[i + 1];
          const aKey = getNormalizedKey(a);
          const bKey = getNormalizedKey(b);
          const dist = haversine(a, b) * weight;

          if (!graph[aKey]) graph[aKey] = {};
          if (!graph[bKey]) graph[bKey] = {};

          if (!graph[aKey][bKey] || graph[aKey][bKey] > dist) {
            graph[aKey][bKey] = dist;
          }
          if (!graph[bKey][aKey] || graph[bKey][aKey] > dist) {
            graph[bKey][aKey] = dist;
          }
        }
      }
    }

    const allPoints = Object.keys(graph);

    for (let i = 0; i < allPoints.length; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        const pointA = allPoints[i].split(',').map(Number);
        const pointB = allPoints[j].split(',').map(Number);
        const distance = haversine(pointA, pointB);

        if (distance < INTERSECTION) {
          if (!graph[allPoints[i]][allPoints[j]] || graph[allPoints[i]][allPoints[j]] > distance) {
            graph[allPoints[i]][allPoints[j]] = distance;
          }
          if (!graph[allPoints[j]][allPoints[i]] || graph[allPoints[j]][allPoints[i]] > distance) {
            graph[allPoints[j]][allPoints[i]] = distance;
          }
        }
      }
    }

    return graph;
  }

  private async mapAllFloorConnections(structureId: number): Promise<StairConnection[]> {
    const allRoutes = await this.internalRouteRepo.find({
      where: {
        structure: { id: structureId }
      }
    });

    const stairsByFloor = new Map<number, number[][]>();
    const doorsByFloor = new Map<number, number[][]>();
    const passagesByConnection = new Map<string, { fromFloor: number; toFloor: number; points: number[][] }>();


    for (const route of allRoutes) {
      if (!route.geometry?.coordinates) continue;

      const floor = route.floor;
      const points: number[][] = [];

      for (const line of route.geometry.coordinates) {
        points.push(...line);
      }

      const isPassarela = route.properties?.type === 'level_passage' || 
                         route.properties?.isConnection === true ||
                         route.properties?.isLevelPassage === true;

      if (isPassarela) {
        const fromFloor = route.properties?.fromFloor ?? floor;
        const toFloor = route.properties?.toFloor;

        if (typeof fromFloor === 'number' && typeof toFloor === 'number' && fromFloor !== toFloor) {
          const key = `${Math.min(fromFloor, toFloor)}-${Math.max(fromFloor, toFloor)}`;
          
          if (!passagesByConnection.has(key)) {
            passagesByConnection.set(key, { 
              fromFloor: Math.min(fromFloor, toFloor), 
              toFloor: Math.max(fromFloor, toFloor), 
              points: [] 
            });
          }
          passagesByConnection.get(key)!.points.push(...points);
        }
      }

      if (route.properties?.isStairs === true) {
        if (!stairsByFloor.has(floor)) stairsByFloor.set(floor, []);
        stairsByFloor.get(floor)!.push(...points);
      }

      if (route.properties?.isDoor === true) {
        if (!doorsByFloor.has(floor)) doorsByFloor.set(floor, []);
        doorsByFloor.get(floor)!.push(...points);
      }
    }

    const connections: StairConnection[] = [];

    for (const [key, { fromFloor, toFloor, points }] of passagesByConnection) {
      if (points.length < 2) {
        console.warn(`      ⚠️  Passarela ${key} sem pontos suficientes`);
        continue;
      }

      connections.push({
        floorA: fromFloor,
        floorB: toFloor,
        pointOnFloorA: points[0],
        pointOnFloorB: points[points.length - 1],
        distance: 0.5,
        type: 'level_passage'
      });

    }

    const allFloors = Array.from(new Set([
      ...stairsByFloor.keys(),
      ...doorsByFloor.keys()
    ])).sort((a, b) => a - b);


    for (let i = 0; i < allFloors.length; i++) {
      for (let j = i + 1; j < allFloors.length; j++) {
        const floorA = allFloors[i];
        const floorB = allFloors[j];

        const isAdjacent = Math.abs(floorB - floorA) === 1;
        if (!isAdjacent) continue;

        const stairsA = stairsByFloor.get(floorA) || [];
        const stairsB = stairsByFloor.get(floorB) || [];

        let connectionsFound = 0;

        for (const pointA of stairsA) {
          for (const pointB of stairsB) {
            const distance = haversine(pointA, pointB);

            if (distance < 10) {
              connections.push({
                floorA,
                floorB,
                pointOnFloorA: pointA,
                pointOnFloorB: pointB,
                distance: 3,
                type: 'stairs'
              });
              connectionsFound++;
            }
          }
        }

      }
    }

    for (let i = 0; i < allFloors.length; i++) {
      for (let j = i + 1; j < allFloors.length; j++) {
        const floorA = allFloors[i];
        const floorB = allFloors[j];

        const doorsA = doorsByFloor.get(floorA) || [];
        const doorsB = doorsByFloor.get(floorB) || [];

        let doorConnectionsFound = 0;

        for (const pointA of doorsA) {
          for (const pointB of doorsB) {
            const distance = haversine(pointA, pointB);

            if (distance < 5) {
              connections.push({
                floorA,
                floorB,
                pointOnFloorA: pointA,
                pointOnFloorB: pointB,
                distance: 0.5,
                type: 'level_passage'
              });
              doorConnectionsFound++;
            }
          }
        }

        
      }
    }
    return connections;
  }

  private async calculateInternalRouteMultiFloor(
    structureId: number,
    startFloor: number,
    startPoint: number[],
    endFloor: number,
    endPoint: number[]
  ): Promise<{ segments: UnifiedRouteSegment[] } | null> {
    const segments: UnifiedRouteSegment[] = [];
    if (startFloor === endFloor) {

      const path = await this.findShortestInternalPath(
        structureId,
        startFloor,
        startPoint,
        endPoint
      );

      if (!path || path.length === 0) {
        console.error(`   ❌ Nenhum caminho encontrado no andar ${startFloor}`);
        return null;
      }

      const distance = this.calculatePathDistance(path);
      segments.push({
        type: 'internal',
        mode: 'walking',
        path,
        floor: startFloor,
        distance,
        description: `Andar ${startFloor} - até o destino (${distance.toFixed(0)}m)`
      });

      return { segments };
    }


    const stairConnections = await this.mapAllFloorConnections(structureId);

    if (stairConnections.length === 0) {
      console.error('❌ Nenhuma conexão encontrada entre andares');
      return null;
    }


    const floorPath = this.findBestFloorPath(startFloor, endFloor, stairConnections);

    if (!floorPath) {
      console.error('❌ Não foi possível conectar os andares');
      return null;
    }


    let currentPoint = startPoint;

    for (let i = 0; i < floorPath.length - 1; i++) {
      const currentFloor = floorPath[i];
      const nextFloor = floorPath[i + 1];


      const connection = this.findBestConnection(
        currentFloor,
        nextFloor,
        currentPoint,
        stairConnections
      );

      if (!connection) {
        console.error(`   ❌ Nenhuma conexão entre andares ${currentFloor} e ${nextFloor}`);
        return null;
      }

      const pathToConnection = await this.findShortestInternalPath(
        structureId,
        currentFloor,
        currentPoint,
        connection.pointOnFloorA
      );

      if (!pathToConnection || pathToConnection.length === 0) {
        const directDistance = haversine(currentPoint, connection.pointOnFloorA);
        const connectionType = connection.type === 'stairs' ? 'escada' : 'passagem';

        segments.push({
          type: 'internal',
          mode: 'walking',
          path: [currentPoint, connection.pointOnFloorA],
          floor: currentFloor,
          distance: directDistance,
          description: `Andar ${currentFloor} - até a ${connectionType} (${directDistance.toFixed(0)}m, linha reta)`
        });
      } else {
        const distanceToConnection = this.calculatePathDistance(pathToConnection);
        const connectionType = connection.type === 'stairs' ? 'escada' : 'passagem';

        segments.push({
          type: 'internal',
          mode: 'walking',
          path: pathToConnection,
          floor: currentFloor,
          distance: distanceToConnection,
          description: `Andar ${currentFloor} - até a ${connectionType} (${distanceToConnection.toFixed(0)}m)`
        });
      }

      const transitionDescription = connection.type === 'stairs'
        ? (nextFloor > currentFloor
          ? `Subir escada: Andar ${currentFloor} → ${nextFloor}`
          : `Descer escada: Andar ${currentFloor} → ${nextFloor}`)
        : `Passagem de nível: Andar ${currentFloor} → ${nextFloor}`;

      segments.push({
        type: 'transition',
        mode: 'walking',
        path: [connection.pointOnFloorA, connection.pointOnFloorB],
        floor: nextFloor,
        distance: connection.distance,
        description: transitionDescription
      });

      currentPoint = connection.pointOnFloorB;
    }

    const lastFloor = floorPath[floorPath.length - 1];
    const finalPath = await this.findShortestInternalPath(
      structureId,
      lastFloor,
      currentPoint,
      endPoint
    );

    if (!finalPath || finalPath.length === 0) {
      console.error(`   ❌ Caminho final não encontrado no andar ${lastFloor}`);
      return null;
    }

    const finalDistance = this.calculatePathDistance(finalPath);
    segments.push({
      type: 'internal',
      mode: 'walking',
      path: finalPath,
      floor: lastFloor,
      distance: finalDistance,
      description: `Andar ${lastFloor} - até o destino (${finalDistance.toFixed(0)}m)`
    });

    return { segments };
  }

  private findBestFloorPath(
    startFloor: number,
    endFloor: number,
    connections: StairConnection[]
  ): number[] | null {
    const graph = new Map<number, Array<{ floor: number; distance: number }>>();

    for (const conn of connections) {
      if (!graph.has(conn.floorA)) graph.set(conn.floorA, []);
      if (!graph.has(conn.floorB)) graph.set(conn.floorB, []);

      graph.get(conn.floorA)!.push({ floor: conn.floorB, distance: conn.distance });
      graph.get(conn.floorB)!.push({ floor: conn.floorA, distance: conn.distance });
    }

    if (!graph.has(startFloor) || !graph.has(endFloor)) {
      return null;
    }

    const distances = new Map<number, number>();
    const previous = new Map<number, number>();
    const unvisited = new Set<number>(graph.keys());

    graph.forEach((_, floor) => distances.set(floor, Infinity));
    distances.set(startFloor, 0);

    while (unvisited.size > 0) {
      let current: number | null = null;
      let minDist = Infinity;

      for (const floor of unvisited) {
        const dist = distances.get(floor)!;
        if (dist < minDist) {
          minDist = dist;
          current = floor;
        }
      }

      if (current === null || current === endFloor) break;

      unvisited.delete(current);

      const neighbors = graph.get(current) || [];
      for (const { floor: neighbor, distance } of neighbors) {
        if (!unvisited.has(neighbor)) continue;

        const alt = distances.get(current)! + distance;
        if (alt < distances.get(neighbor)!) {
          distances.set(neighbor, alt);
          previous.set(neighbor, current);
        }
      }
    }

    const path: number[] = [];
    let current: number | undefined = endFloor;

    while (current !== undefined) {
      path.unshift(current);
      current = previous.get(current);
    }

    return path[0] === startFloor ? path : null;
  }

  private findBestConnection(
    floorA: number,
    floorB: number,
    currentPoint: number[],
    connections: StairConnection[]
  ): StairConnection | null {
    const validConnections = connections.filter(
      c => (c.floorA === floorA && c.floorB === floorB) ||
        (c.floorA === floorB && c.floorB === floorA)
    );

    if (validConnections.length === 0) return null;

    let bestConnection: StairConnection | null = null;
    let minDistance = Infinity;

    for (const conn of validConnections) {
      const pointToCheck = conn.floorA === floorA ? conn.pointOnFloorA : conn.pointOnFloorB;
      const distance = haversine(currentPoint, pointToCheck);

      if (distance < minDistance) {
        minDistance = distance;

        bestConnection = conn.floorA === floorA ? conn : {
          floorA: conn.floorB,
          floorB: conn.floorA,
          pointOnFloorA: conn.pointOnFloorB,
          pointOnFloorB: conn.pointOnFloorA,
          distance: conn.distance,
          type: conn.type
        };
      }
    }

    return bestConnection;
  }

  private reconstructFullPath(
    routes: ExternalRoute[] | InternalRoute[],
    graphPath: string[]
  ): number[][] {
    if (graphPath.length < 2) {
      return graphPath.map(p => p.split(',').map(Number));
    }

    const fullPath: number[][] = [];

    for (let i = 0; i < graphPath.length - 1; i++) {
      const currentNode = graphPath[i].split(',').map(Number);
      const nextNode = graphPath[i + 1].split(',').map(Number);

      if (i === 0 || !this.arePointsEqual(fullPath[fullPath.length - 1], currentNode)) {
        fullPath.push([...currentNode]);
      }

      const segmentPath = this.findRouteSegmentBetweenPoints(routes, currentNode, nextNode);

      if (segmentPath.length > 0) {
        for (let j = 1; j < segmentPath.length; j++) {
          fullPath.push([...segmentPath[j]]);
        }
      } else {
        fullPath.push([...nextNode]);
      }
    }

    const lastNode = graphPath[graphPath.length - 1].split(',').map(Number);
    if (!this.arePointsEqual(fullPath[fullPath.length - 1], lastNode)) {
      fullPath.push([...lastNode]);
    }

    return fullPath;
  }

  private findRouteSegmentBetweenPoints(
    routes: ExternalRoute[] | InternalRoute[],
    start: number[],
    end: number[]
  ): number[][] {
    const TOLERANCE = 50000;

    let bestSegment: number[][] | null = null;
    let bestDistance = Infinity;

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;

      const lines = route.geometry.coordinates;
      for (const line of lines) {
        if (line.length < 2) continue;

        let startIdx = -1;
        let endIdx = -1;
        let minStartDist = Infinity;
        let minEndDist = Infinity;

        for (let i = 0; i < line.length; i++) {
          const startDist = haversine(start, line[i]);
          const endDist = haversine(end, line[i]);

          if (startDist < minStartDist && startDist < TOLERANCE) {
            minStartDist = startDist;
            startIdx = i;
          }
          if (endDist < minEndDist && endDist < TOLERANCE) {
            minEndDist = endDist;
            endIdx = i;
          }
        }

        if (startIdx !== -1 && endIdx !== -1) {
          const segmentDistance = Math.abs(endIdx - startIdx);

          if (segmentDistance > bestDistance) {
            bestDistance = segmentDistance;

            if (startIdx < endIdx) {
              bestSegment = line.slice(startIdx, endIdx + 1);
            } else {
              bestSegment = line.slice(endIdx, startIdx + 1).reverse();
            }
          }
        }
      }
    }

    return bestSegment && bestSegment.length > 0 ? bestSegment : [start, end];
  }

  private arePointsEqual(point1: number[], point2: number[], tolerance: number = 0.000001): boolean {
    return haversine(point1, point2) < tolerance;
  }

  private async findShortestInternalPath(
    structureId: number,
    floor: number,
    start: number[],
    end: number[]
  ): Promise<number[][]> {
    const routes = await this.internalRouteRepo.find({
      where: {
        structure: { id: structureId },
        floor
      }
    });

    const graph = this.buildGraph(routes);
    const startKey = this.findNearestGraphNode(graph, start, 50);
    const endKey = this.findNearestGraphNode(graph, end, 50);

    if (!startKey || !endKey) {
      return [];
    }

    const path = this.dijkstra(graph, startKey, endKey);

    if (path.length === 0) return [];

    return this.reconstructFullPath(routes, path);
  }

  private buildGraph(routes: any[]): Record<string, Record<string, number>> {
    const graph: Record<string, Record<string, number>> = {};
    const NORMALIZATION = 0.5;
    const INTERSECTION = 5;

    const pointMap = new Map<string, string>();
    const allRawPoints: number[][] = [];

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;
      for (const line of route.geometry.coordinates) {
        for (const point of line) {
          allRawPoints.push(point);
        }
      }
    }

    for (let i = 0; i < allRawPoints.length; i++) {
      const pointA = allRawPoints[i];
      const keyA = pointA.join(',');

      if (pointMap.has(keyA)) continue;

      for (let j = i + 1; j < allRawPoints.length; j++) {
        const pointB = allRawPoints[j];
        const distance = haversine(pointA, pointB);

        if (distance < NORMALIZATION) {
          const keyB = pointB.join(',');
          pointMap.set(keyB, keyA);
        }
      }

      pointMap.set(keyA, keyA);
    }

    const getNormalizedKey = (point: number[]): string => {
      const key = point.join(',');
      return pointMap.get(key) || key;
    };

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;

      const lines = route.geometry.coordinates;
      for (const line of lines) {
        for (let i = 0; i < line.length - 1; i++) {
          const a = line[i];
          const b = line[i + 1];
          const aKey = getNormalizedKey(a);
          const bKey = getNormalizedKey(b);
          const dist = haversine(a, b);

          if (!graph[aKey]) graph[aKey] = {};
          if (!graph[bKey]) graph[bKey] = {};

          if (!graph[aKey][bKey] || graph[aKey][bKey] > dist) {
            graph[aKey][bKey] = dist;
          }
          if (!graph[bKey][aKey] || graph[bKey][aKey] > dist) {
            graph[bKey][aKey] = dist;
          }
        }
      }
    }

    const allPoints = Object.keys(graph);

    for (let i = 0; i < allPoints.length; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        const pointA = allPoints[i].split(',').map(Number);
        const pointB = allPoints[j].split(',').map(Number);
        const distance = haversine(pointA, pointB);

        if (distance < INTERSECTION) {
          if (!graph[allPoints[i]][allPoints[j]] || graph[allPoints[i]][allPoints[j]] > distance) {
            graph[allPoints[i]][allPoints[j]] = distance;
          }
          if (!graph[allPoints[j]][allPoints[i]] || graph[allPoints[j]][allPoints[i]] > distance) {
            graph[allPoints[j]][allPoints[i]] = distance;
          }
        }
      }
    }

    return graph;
  }

  private dijkstra(
    graph: Record<string, Record<string, number>>,
    start: string,
    end: string
  ): string[] {
    const distances: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const visited: Set<string> = new Set();

    Object.keys(graph).forEach(node => {
      distances[node] = Infinity;
      prev[node] = null;
    });

    distances[start] = 0;

    while (visited.size < Object.keys(graph).length) {
      let minNode: string | null = null;
      let minDist = Infinity;

      for (const node in distances) {
        if (!visited.has(node) && distances[node] < minDist) {
          minDist = distances[node];
          minNode = node;
        }
      }

      if (minNode === null || minNode === end) break;

      visited.add(minNode);

      for (const neighbor in graph[minNode]) {
        const alt = distances[minNode] + graph[minNode][neighbor];
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          prev[neighbor] = minNode;
        }
      }
    }

    const path: string[] = [];
    let curr: string | null = end;
    while (curr) {
      path.unshift(curr);
      curr = prev[curr];
    }

    return path[0] === start ? path : [];
  }

  private findNearestGraphNode(
    graph: Record<string, Record<string, number>>,
    point: number[],
    maxTolerance: number
  ): string | null {
    let minDist = Infinity;
    let nearest: string | null = null;

    for (const nodeKey of Object.keys(graph)) {
      const nodeCoords = nodeKey.split(',').map(Number);
      const dist = haversine(point, nodeCoords);

      if (dist < minDist) {
        minDist = dist;
        nearest = nodeKey;
      }
    }

    return minDist <= maxTolerance ? nearest : null;
  }

  private calculatePathDistance(path: number[][]): number {
    let distance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      distance += haversine(path[i], path[i + 1]);
    }
    return distance;
  }

  private extractCoordinates(centroid: any): number[] | null {
    if (!centroid) return null;

    let parsed = centroid;
    if (typeof centroid === 'string') {
      try {
        parsed = JSON.parse(centroid);
      } catch {
        return null;
      }
    }

    if (parsed.type === 'Point') {
      return parsed.coordinates;
    } else if (parsed.type === 'Polygon' && Array.isArray(parsed.coordinates)) {
      const poly = parsed.coordinates[0];
      const avg = poly.reduce((acc: number[], cur: number[]) => [
        acc[0] + cur[0],
        acc[1] + cur[1]
      ], [0, 0]);
      return [avg[0] / poly.length, avg[1] / poly.length];
    }

    return null;
  }
}