import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { findShortestInternalRoute, haversine } from './internalRoutePathfinding';
import { Room } from '../entities/Room';
import { Structure } from '../entities/Structure';
import { In } from 'typeorm';
import { ExternalRouteService } from './ExternalRouteService';

export class InternalRouteService {
  private externalService = new ExternalRouteService();

  /**
   * Find shortest route, supporting multi-floor navigation using stairs.
   * Returns separated paths for each floor for progressive display.
   * NOVO: Adiciona rota externa do usuário até a entrada da estrutura
   */
  async findShortestRouteToDestination(
    structureId: number,
    startFloor: number,
    start: number[],
    roomId?: number
  ): Promise<
    | { 
        pathToStairs: number[][]; 
        stairsTransition: { from: number[]; to: number[] }; 
        pathFromStairs: number[][]; 
        destinationFloor: number; 
        availableFloors: number[];
        floorPaths: { floor: number; path: number[][] }[];
        stairTransitions: { from: number[]; to: number[]; fromFloor: number; toFloor: number }[];
        structure: any;
        roomsByFloor: { [floor: number]: any[] };
      }
    | { path: number[][] }
    | null
  > {
    const end = await this.getDestinationCoords(roomId, structureId);
    if (!end) {
      return null;
    }

    // Find destination room and its floor
    let destFloor = startFloor;
    if (roomId) {
      console.log('[DEBUG] Room ID provided:', roomId);
      const roomRepo = AppDataSource.getRepository(Room);
      const room = await roomRepo.findOne({ where: { id: Number(roomId) } });
      if (room && typeof room.floor === 'number') destFloor = room.floor;
    }

    const nearestDoor = await this.externalService.findNearestDoorPoint(start);
    
    let entryPoint = start;
    let externalPath: number[][] = [];

    if (nearestDoor && nearestDoor.distance < 1000) { 
      console.log(`🚪 Porta encontrada a ${nearestDoor.distance.toFixed(2)}m`);
      entryPoint = nearestDoor.doorPoint;
      
      externalPath = await this.externalService.calculateExternalPath(start, nearestDoor.doorPoint);
    }

    if (startFloor === destFloor) {
      const path = await this.findShortestRoute(structureId, startFloor, entryPoint, end);
      
      if (!path) return null;

      const fullPath = externalPath.length > 0 
        ? [...externalPath, ...path]
        : path;

      return { path: fullPath };
    }

    const allFloorsData = await this.routeRepo
      .createQueryBuilder('route')
      .select('DISTINCT route.floor', 'floor')
      .where('route.structureId = :structureId', { structureId })
      .orderBy('route.floor', 'ASC')
      .getRawMany();
    
    const allAvailableFloors = allFloorsData.map(f => f.floor).sort((a, b) => a - b);

    const isGoingUp = startFloor < destFloor;
    
    const floorsInRoute = allAvailableFloors.filter(floor => 
      isGoingUp 
        ? floor >= startFloor && floor <= destFloor
        : floor <= startFloor && floor >= destFloor
    );

    if (floorsInRoute.length < 2) {
      console.log('Not enough floors in route');
      return null;
    }

    const floorPaths: { floor: number; path: number[][] }[] = [];
    const stairTransitions: { from: number[]; to: number[]; fromFloor: number; toFloor: number }[] = [];

    for (let i = 0; i < floorsInRoute.length; i++) {
      const currentFloor = floorsInRoute[i];
      const isFirstFloor = i === 0;
      const isLastFloor = i === floorsInRoute.length - 1;

      if (isFirstFloor) {
        const stairsCurrentFloor = await this.getStairs(structureId, currentFloor);
        if (!stairsCurrentFloor.length) {
          return null;
        }

        const nearestStair = this.findNearestStair(stairsCurrentFloor, entryPoint);
        if (!nearestStair) return null;

        const pathToStair = await this.findShortestRoute(structureId, currentFloor, entryPoint, nearestStair);
        if (!pathToStair) return null;

        const pathWithExternal = externalPath.length > 0
          ? [...externalPath, ...pathToStair]
          : pathToStair;

        floorPaths.push({ floor: currentFloor, path: pathWithExternal });

        if (!isLastFloor) {
          const nextFloor = floorsInRoute[i + 1];
          const stairsNextFloor = await this.getStairs(structureId, nextFloor);
          
          if (!stairsNextFloor.length) {
            console.log(`No stairs found on floor ${nextFloor}`);
            return null;
          }

          const stairOnNextFloor = this.findNearestStair(stairsNextFloor, nearestStair);
          if (!stairOnNextFloor) return null;

          stairTransitions.push({
            from: nearestStair,
            to: stairOnNextFloor,
            fromFloor: currentFloor,
            toFloor: nextFloor
          });
        }
      }
      else if (isLastFloor) {
        const entryPointFloor = stairTransitions[stairTransitions.length - 1].to;
        const pathToDestination = await this.findShortestRoute(structureId, currentFloor, entryPointFloor, end);
        if (!pathToDestination) return null;

        floorPaths.push({ floor: currentFloor, path: pathToDestination });
      }
      else {
        const stairsCurrentFloor = await this.getStairs(structureId, currentFloor);
        const nextFloor = floorsInRoute[i + 1];
        const stairsNextFloor = await this.getStairs(structureId, nextFloor);

        if (!stairsCurrentFloor.length || !stairsNextFloor.length) {
          console.log(`No stairs found between floor ${currentFloor} and ${nextFloor}`);
          return null;
        }

        const entryPointFloor = stairTransitions[stairTransitions.length - 1].to;
        const distance = haversine(entryPointFloor, stairsCurrentFloor[0]);
        const isSameStairLocation = distance < 0.002;
        
        if (isSameStairLocation) {
          floorPaths.push({ floor: currentFloor, path: [entryPointFloor] });
          
          const stairOnNextFloor = this.findNearestStair(stairsNextFloor, entryPointFloor);
          if (!stairOnNextFloor) return null;

          stairTransitions.push({
            from: entryPointFloor,
            to: stairOnNextFloor,
            fromFloor: currentFloor,
            toFloor: nextFloor
          });
        } else {
          const nextStair = this.findNearestStair(stairsCurrentFloor, entryPointFloor);
          if (!nextStair) return null;

          const pathAcrossFloor = await this.findShortestRoute(structureId, currentFloor, entryPointFloor, nextStair);
          if (!pathAcrossFloor) return null;

          floorPaths.push({ floor: currentFloor, path: pathAcrossFloor });

          const stairOnNextFloor = this.findNearestStair(stairsNextFloor, nextStair);
          if (!stairOnNextFloor) return null;

          stairTransitions.push({
            from: nextStair,
            to: stairOnNextFloor,
            fromFloor: currentFloor,
            toFloor: nextFloor
          });
        }
      }
    }

    const structureRepo = AppDataSource.getRepository(Structure);
    const roomRepo = AppDataSource.getRepository(Room);
    
    console.log(`🔍 [InternalRouteService] Buscando estrutura com ID: ${structureId}`);
    const structure = await structureRepo.findOne({ 
      where: { id: structureId },
      select: ['id', 'name', 'floors', 'centroid', 'geometry']
    });

    const rooms = await roomRepo.find({
      where: {
        structure: { id: structureId },
        floor: In(floorsInRoute)
      },
      select: ['id', 'name', 'floor', 'centroid', 'geometry']
    });

    const roomsByFloor: { [floor: number]: any[] } = {};
    for (const floor of floorsInRoute) {
      roomsByFloor[floor] = rooms.filter(r => r.floor === floor);
    }

    return {
      pathToStairs: floorPaths[0].path,
      stairsTransition: stairTransitions[0],
      pathFromStairs: floorPaths[floorPaths.length - 1].path,
      destinationFloor: destFloor,
      availableFloors: floorsInRoute,
      floorPaths,
      stairTransitions,
      structure,
      roomsByFloor,
    };
  }

  async getStairs(structureId: number, floor: number): Promise<number[][]> {
    const routes = await this.getRoutesByStructure(structureId, floor);
    const stairs: number[][] = [];
    for (const route of routes) {
      if (route.properties && route.properties.isStairs) {
        const lines = route.geometry.coordinates;
        for (const line of lines) {
          for (const coord of line) {
            stairs.push(coord);
          }
        }
      }
    }
    return stairs;
  }

  findNearestStair(stairs: number[][], point: number[]): number[] | null {
    let minDist = Infinity;
    let nearest: number[] | null = null;
    for (const stair of stairs) {
      const dist = haversine(stair, point);
      if (dist < minDist) {
        minDist = dist;
        nearest = stair;
      }
    }
    return nearest;
  }

  private routeRepo = AppDataSource.getRepository(InternalRoute);

  async createRoute(data: Partial<InternalRoute>) {
    return await this.routeRepo.save(this.routeRepo.create(data));
  }

  async getRoutesByStructure(structureId: number, floor?: number) {
    const where: any = { structure: { id: structureId } };
    if (floor !== undefined) where.floor = floor;
    return await this.routeRepo.find({ where, relations: ['structure'] });
  }

  async getAllRoutes() {
    return await this.routeRepo.find({ relations: ['structure'] });
  }

  async findShortestRoute(structureId: number, floor: number, start: number[], end: number[]) {
    const routes = await this.getRoutesByStructure(structureId, floor);
    return findShortestInternalRoute(routes, start, end);
  }

  async getDestinationCoords(roomId?: number, structureId?: number): Promise<number[] | null> {
    if (roomId) {
      const roomRepo = AppDataSource.getRepository(Room);
      const room = await roomRepo.findOne({ where: { id: Number(roomId) } });
      if (!room || !room.centroid) return null;
      
      let centroid = room.centroid;
      if (typeof centroid === 'string') {
        try {
          centroid = JSON.parse(centroid);
        } catch (e) {
          return null;
        }
      }
      
      if (centroid.type === 'Point') {
        return centroid.coordinates;
      } else if (centroid.type === 'Polygon' && Array.isArray(centroid.coordinates)) {
        const poly = centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      return null;
    } else if (structureId) {
      const structureRepo = AppDataSource.getRepository(Structure);
      const structure = await structureRepo.findOne({ where: { id: Number(structureId) } });
      if (!structure || !structure.centroid) return null;
      
      let centroid = structure.centroid;
      if (typeof centroid === 'string') {
        try {
          centroid = JSON.parse(centroid);
        } catch (e) {
          return null;
        }
      }
      
      if (centroid.type === 'Point') {
        return centroid.coordinates;
      } else if (centroid.type === 'Polygon' && Array.isArray(centroid.coordinates)) {
        const poly = centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      return null;
    }
    return null;
  }
}