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

    const nearestDoor = await this.findNearestStructureDoor(structureId, userPosition);
    
    if (!nearestDoor) {
      console.error('❌ Nenhuma entrada encontrada para a estrutura');
      return null;
    }

    const entryPoint = nearestDoor.coordinates;
    const entryFloor = nearestDoor.floor;
    
  
    const externalDistance = haversine(userPosition, entryPoint);
    
    if (externalDistance > 10) { 
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
            ? `Dirigir até a entrada (${segmentDistance.toFixed(0)}m)`
            : `Caminhar até a entrada (${segmentDistance.toFixed(0)}m)`
        });
        totalDistance += segmentDistance;

      }
    }

    const internalRouteResult = await this.calculateInternalRouteWithStairs(
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
      where: { id: structureId },
      select: ['id', 'name', 'floors', 'centroid', 'geometry']
    });

    const allFloors = [...new Set([entryFloor, destinationFloor, ...floorsTraversed])].sort((a, b) => a - b);
    
    const rooms = await this.roomRepo.find({
      where: {
        structure: { id: structureId },
        floor: In(allFloors)
      },
      select: ['id', 'name', 'floor', 'centroid', 'geometry']
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
    position: number[]
  ): Promise<{ coordinates: number[]; floor: number; distance: number } | null> {
    const doorRoutes = await this.internalRouteRepo.find({
      where: {
        structure: { id: structureId }
      }
    });

    let minDistance = Infinity;
    let nearestDoor: { coordinates: number[]; floor: number; distance: number } | null = null;

    for (const route of doorRoutes) {
      if (!route.properties?.isDoor) continue;
      if (!route.geometry?.coordinates) continue;

      const lines = route.geometry.coordinates;
      for (const line of lines) {
        for (const point of line) {
          const distance = haversine(position, point);
          if (distance < minDistance) {
            minDistance = distance;
            nearestDoor = {
              coordinates: point,
              floor: route.floor,
              distance
            };
          }
        }
      }
    }

    return nearestDoor;
  }

  private async calculateExternalRoute(
    start: number[],
    end: number[],
    mode: RouteMode
  ): Promise<number[][]> {
    const routes = await this.externalRouteRepo.find();
    
    const filteredRoutes = routes.filter(route => {
      if (!route.properties?.mode) return mode === 'walking';
      return route.properties.mode === mode;
    });

    if (filteredRoutes.length === 0) {
      console.warn(`⚠️ Nenhuma rota externa ${mode} encontrada, usando todas`);
      return this.findShortestExternalPath(routes, start, end);
    }

    return this.findShortestExternalPath(filteredRoutes, start, end);
  }

  private async calculateInternalRouteWithStairs(
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



    const isGoingUp = startFloor < endFloor;
    const floorsToTraverse = [];
    
    if (isGoingUp) {
      for (let f = startFloor; f <= endFloor; f++) {
        floorsToTraverse.push(f);
      }
    } else {
      for (let f = startFloor; f >= endFloor; f--) {
        floorsToTraverse.push(f);
      }
    }



    let currentPoint = startPoint;

    for (let i = 0; i < floorsToTraverse.length; i++) {
      const currentFloor = floorsToTraverse[i];
      const isLastFloor = i === floorsToTraverse.length - 1;



      if (isLastFloor) {
;
        
        const path = await this.findShortestInternalPath(
          structureId,
          currentFloor,
          currentPoint,
          endPoint
        );

        if (!path || path.length === 0) {
          console.error(`   ❌ Nenhum caminho encontrado no andar ${currentFloor}`);
          return null;
        }

        const distance = this.calculatePathDistance(path);
        segments.push({
          type: 'internal',
          mode: 'walking',
          path,
          floor: currentFloor,
          distance,
          description: `Andar ${currentFloor} - até o destino (${distance.toFixed(0)}m)`
        });
      } else {
        const stairs = await this.getStairs(structureId, currentFloor);
        
        if (!stairs || stairs.length === 0) {
          console.error(`   ❌ Nenhuma escada encontrada no andar ${currentFloor}`);
          return null;
        }


        const nearestStair = this.findNearestPoint(stairs, currentPoint);

        const pathToStair = await this.findShortestInternalPath(
          structureId,
          currentFloor,
          currentPoint,
          nearestStair
        );

        if (!pathToStair || pathToStair.length === 0) {
          console.error(`   ❌ Não foi possível calcular caminho até a escada no andar ${currentFloor}`);
          return null;
        }

        const distance = this.calculatePathDistance(pathToStair);

        segments.push({
          type: 'internal',
          mode: 'walking',
          path: pathToStair,
          floor: currentFloor,
          distance,
          description: `Andar ${currentFloor} - até a escada (${distance.toFixed(0)}m)`
        });

        const nextFloor = floorsToTraverse[i + 1];
        const nextStairs = await this.getStairs(structureId, nextFloor);
        
        if (!nextStairs || nextStairs.length === 0) {
          console.error(`   ❌ Nenhuma escada encontrada no andar ${nextFloor}`);
          return null;
        }

        const stairOnNextFloor = this.findNearestPoint(nextStairs, nearestStair);



        segments.push({
          type: 'transition',
          mode: 'walking',
          path: [nearestStair, stairOnNextFloor],
          floor: nextFloor,
          distance: 3,
          description: isGoingUp 
            ? `Subir escada: Andar ${currentFloor} → ${nextFloor}`
            : `Descer escada: Andar ${currentFloor} → ${nextFloor}`
        });

        currentPoint = stairOnNextFloor;
      }
    }

    return { segments };
  }

  /**
   *CORREÇÃO PRINCIPAL: Reconstruir caminho completo com TODOS os pontos
   */
  private findShortestExternalPath(
    routes: ExternalRoute[],
    start: number[],
    end: number[],
    tolerance: number = 100
  ): number[][] {
    
    
    const graph = this.buildGraph(routes);
    const startKey = this.findNearestGraphNode(graph, start, tolerance);
    const endKey = this.findNearestGraphNode(graph, end, tolerance);

    if (!startKey || !endKey) {
      console.warn('⚠️ Não foi possível conectar ao grafo externo');
      return [start, end];
    }

  

    const graphPath = this.dijkstra(graph, startKey, endKey);
    
    if (graphPath.length === 0) {
      console.warn('⚠️ Nenhum caminho encontrado no grafo');
      return [start, end];
    }



    const fullPath = this.reconstructFullPath(routes, graphPath);
    
    const result: number[][] = [];
    

    if (haversine(start, fullPath[0]) > 5) {
      result.push(start);
    }
    
    result.push(...fullPath);
    
    if (haversine(end, fullPath[fullPath.length - 1]) > 5) {
      result.push(end);
    }

    return result;
  }

  /**
   * MÉTODO CRÍTICO: Reconstruir caminho completo entre nós do grafo
   */
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
      
      const segmentPath = this.findRouteSegmentBetweenPoints(
        routes,
        currentNode,
        nextNode
      );
      
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

  /**
   *  Encontrar TODOS os pontos entre dois nós em uma rota
   */
  private findRouteSegmentBetweenPoints(
    routes: ExternalRoute[] | InternalRoute[],
    start: number[],
    end: number[]
  ): number[][] {
    const SEARCH_TOLERANCE = 50; 
    
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
          
          if (startDist < minStartDist && startDist < SEARCH_TOLERANCE) {
            minStartDist = startDist;
            startIdx = i;
          }
          if (endDist < minEndDist && endDist < SEARCH_TOLERANCE) {
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
    
    if (bestSegment && bestSegment.length > 0) {
      return bestSegment;
    }
    
    return [start, end];
  }

  private arePointsEqual(
    point1: number[],
    point2: number[],
    tolerance: number = 0.000001
  ): boolean {
    if (point1.length !== point2.length) return false;
    
    const dist = haversine(point1, point2);
    return dist < tolerance;
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
      console.warn(`⚠️ Não foi possível conectar ao grafo interno (andar ${floor})`);
      return [];
    }

    const path = this.dijkstra(graph, startKey, endKey);
    
    if (path.length === 0) {
      return [];
    }

    const fullPath = this.reconstructFullPath(routes, path);
    
    return fullPath;
  }

  private buildGraph(routes: any[]): Record<string, Record<string, number>> {
    const graph: Record<string, Record<string, number>> = {};
    const NORMALIZATION_THRESHOLD = 0.5;
    const INTERSECTION_THRESHOLD = 5;

    const pointMap = new Map<string, string>();
    const allRawPoints: number[][] = [];

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;

      const lines = route.geometry.coordinates;
      for (const line of lines) {
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
        
        if (distance < NORMALIZATION_THRESHOLD) {
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

        if (distance < INTERSECTION_THRESHOLD) {
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

  private async getStairs(structureId: number, floor: number): Promise<number[][]> {
    const routes = await this.internalRouteRepo.find({
      where: {
        structure: { id: structureId },
        floor
      }
    });

    const stairs: number[][] = [];
    for (const route of routes) {
      if (route.properties?.isStairs) {
        const lines = route.geometry.coordinates;
        for (const line of lines) {
          stairs.push(...line);
        }
      }
    }

    return stairs;
  }

  private findNearestPoint(points: number[][], target: number[]): number[] {
    let minDist = Infinity;
    let nearest = points[0];

    for (const point of points) {
      const dist = haversine(point, target);
      if (dist < minDist) {
        minDist = dist;
        nearest = point;
      }
    }

    return nearest;
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