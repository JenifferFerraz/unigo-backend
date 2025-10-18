import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { findShortestInternalRoute } from './internalRoutePathfinding';
import { Room } from '../entities/Room';
import { Structure } from '../entities/Structure';

export class InternalRouteService {
 

  async findShortestRouteToDestination(structureId: number, floor: number, start: number[], roomId?: number): Promise<number[][] | null> {
    const end = await this.getDestinationCoords(roomId, structureId);
    if (!end) return null;
    return this.findShortestRoute(structureId, floor, start, end);
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
      if (room.centroid.type === 'Point') {
        return room.centroid.coordinates;
      } else if (room.centroid.type === 'Polygon' && Array.isArray(room.centroid.coordinates)) {
        const poly = room.centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      return null;
    } else if (structureId) {
  const structureRepo = AppDataSource.getRepository(Structure);
      const structure = await structureRepo.findOne({ where: { id: Number(structureId) } });
      if (!structure || !structure.centroid) return null;
      if (structure.centroid.type === 'Point') {
        return structure.centroid.coordinates;
      } else if (structure.centroid.type === 'Polygon' && Array.isArray(structure.centroid.coordinates)) {
        const poly = structure.centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      return null;
    }
    return null;
  }
}
