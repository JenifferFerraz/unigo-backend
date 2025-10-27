import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { findShortestInternalRoute, haversine } from './internalRoutePathfinding';
import { Room } from '../entities/Room';
import { Structure } from '../entities/Structure';

export class InternalRouteService {
 

  /**
   * Find shortest route, supporting multi-floor navigation using stairs.
   * If start and destination are on different floors, finds path to nearest stairs, then from stairs on target floor to destination.
   */
  /**
   * Find shortest route, supporting multi-floor navigation using stairs.
   * Returns separated paths for each floor for progressive display.
   */
  async findShortestRouteToDestination(
    structureId: number,
    startFloor: number,
    start: number[],
    roomId?: number
  ): Promise<
    | { pathToStairs: number[][]; stairsTransition: { from: number[]; to: number[] }; pathFromStairs: number[][]; destinationFloor: number }
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
      const roomRepo = AppDataSource.getRepository(Room);
      const room = await roomRepo.findOne({ where: { id: Number(roomId) } });
      if (room && typeof room.floor === 'number') destFloor = room.floor;
    }

    if (startFloor === destFloor) {
      const routes = await this.getRoutesByStructure(structureId, startFloor);
      const path = await this.findShortestRoute(structureId, startFloor, start, end);
      return { path };
    }

    const stairsStartFloor = await this.getStairs(structureId, startFloor);
    const stairsDestFloor = await this.getStairs(structureId, destFloor);
  
    if (!stairsStartFloor.length || !stairsDestFloor.length) {
  
      return null;
    }

    const nearestStairStart = this.findNearestStair(stairsStartFloor, start);
    const nearestStairEnd = this.findNearestStair(stairsDestFloor, end);
  
    if (!nearestStairStart || !nearestStairEnd) {
      return null;
    }

    const pathToStairs = await this.findShortestRoute(structureId, startFloor, start, nearestStairStart);
    const pathFromStairs = await this.findShortestRoute(structureId, destFloor, nearestStairEnd, end);
  
    if (!pathToStairs || !pathFromStairs) {
      return null;
    }

    return {
      pathToStairs,
      stairsTransition: { from: nearestStairStart, to: nearestStairEnd },
      pathFromStairs,
      destinationFloor: destFloor,
    };
  }

  /** Get all stairs nodes (as coordinates) for a given structure and floor */
  async getStairs(structureId: number, floor: number): Promise<number[][]> {
    const routes = await this.getRoutesByStructure(structureId, floor);
    const stairs: number[][] = [];
    for (const route of routes) {
      if (route.properties && route.properties.isStairs) {
        // Use all coordinates in the MultiLineString as possible stair nodes
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

  /** Find the stair node closest to a given point */
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
      console.log('getDestinationCoords - room:', room);
      if (!room || !room.centroid) {
        console.log('getDestinationCoords - room not found or centroid missing');
        return null;
      }
      let centroid = room.centroid;
      if (typeof centroid === 'string') {
        try {
          centroid = JSON.parse(centroid);
        } catch (e) {
          console.log('getDestinationCoords - centroid parse error:', centroid);
          return null;
        }
      }
      console.log('getDestinationCoords - centroid:', centroid);
      if (centroid.type === 'Point') {
        return centroid.coordinates;
      } else if (centroid.type === 'Polygon' && Array.isArray(centroid.coordinates)) {
        const poly = centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      console.log('getDestinationCoords - centroid type not handled:', centroid.type);
      return null;
    } else if (structureId) {
      const structureRepo = AppDataSource.getRepository(Structure);
      const structure = await structureRepo.findOne({ where: { id: Number(structureId) } });
      console.log('getDestinationCoords - structure:', structure);
      if (!structure || !structure.centroid) {
        console.log('getDestinationCoords - structure not found or centroid missing');
        return null;
      }
      let centroid = structure.centroid;
      if (typeof centroid === 'string') {
        try {
          centroid = JSON.parse(centroid);
        } catch (e) {
          console.log('getDestinationCoords - structure centroid parse error:', centroid);
          return null;
        }
      }
      console.log('getDestinationCoords - structure centroid:', centroid);
      if (centroid.type === 'Point') {
        return centroid.coordinates;
      } else if (centroid.type === 'Polygon' && Array.isArray(centroid.coordinates)) {
        const poly = centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      console.log('getDestinationCoords - structure centroid type not handled:', centroid.type);
      return null;
    }
    console.log('getDestinationCoords - no roomId or structureId');
    return null;
  }
}
