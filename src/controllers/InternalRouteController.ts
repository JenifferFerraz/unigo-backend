import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { Structure } from '../entities/Structure';
import { InternalRouteService } from '../services/InternalRouteService';
import { ExternalRouteService } from '../services/ExternalRouteService';

export class InternalRouteController {

  private routeRepo = AppDataSource.getRepository(InternalRoute);

  async create(req: Request, res: Response) {
    try {
      const { structureId, floor, geometry, properties } = req.body;
      const structure = await AppDataSource.getRepository(Structure).findOne({ where: { id: structureId } });
      if (!structure) return res.status(404).json({ error: 'Structure not found' });
      const route = this.routeRepo.create({ structure, floor, geometry, properties });
      await this.routeRepo.save(route);
      return res.status(201).json(route);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response) {
    const routes = await this.routeRepo.find({ relations: ['structure'] });
    return res.json(routes);
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const numId = Number(id);
    if (isNaN(numId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const route = await this.routeRepo.findOne({ where: { id: numId }, relations: ['structure'] });
    if (!route) return res.status(404).json({ error: 'Not found' });
    return res.json(route);
  }

  async getByStructure(req: Request, res: Response) {
    const { structureId, floor } = req.query;
    const where: any = {};
    if (structureId) where.structure = { id: Number(structureId) };
    if (floor) where.floor = Number(floor);
    const routes = await this.routeRepo.find({ where, relations: ['structure'] });
    return res.json(routes);
  }

  async getShortest(req: Request, res: Response) {
    const { structureId, floor, start, end } = req.query;
    if (!structureId || !floor || !start || !end) {
      return res.status(400).json({ error: 'structureId, floor, start, end required' });
    }
    const service = new (await import('../services/InternalRouteService')).InternalRouteService();
    const startArr = String(start).split(',').map(Number);
    const endArr = String(end).split(',').map(Number);
    try {
      const path = await service.findShortestRoute(Number(structureId), Number(floor), startArr, endArr);
      return res.json(path);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }


  /**
   * Retorna todas as rotas internas e externas, todas no floor 'z'.
   */
  async getAllRoutesWithExternal(req: Request, res: Response) {
    try {
      // Rotas internas (todas, ignorando floor)
      const internalRoutes = await this.routeRepo.find({ relations: ['structure'] });

      const externalService = new ExternalRouteService();
      const externalRoutes = await externalService.getAll();

      const externalWithFloor = externalRoutes.map(route => ({ ...route, floor: 'z' }));

      // Junta tudo
      const allRoutes = [
        ...internalRoutes,
        ...externalWithFloor
      ];

      return res.json(allRoutes);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  // Adicione este método ao InternalRouteController

  async getShortestToRoomWithExternalContext(req: Request, res: Response) {
    console.log('getShortestToRoomWithExternalContext body:', req.body);

    const { roomId, structureId, floor, start } = req.body;

    if (structureId == null || floor == null || start == null) {
      return res.status(400).json({
        error: 'structureId, floor, start required'
      });
    }

    try {
      const service = new InternalRouteService();
      const externalService = new ExternalRouteService();

      const startArr = Array.isArray(start)
        ? start.map(Number)
        : String(start).split(',').map(Number);

      // 1. Calcula a rota interna
      const internalPath = await service.findShortestRouteToDestination(
        Number(structureId),
        Number(floor),
        startArr,
        roomId ? Number(roomId) : undefined
      );

      if (!internalPath) {
        return res.status(404).json({
          error: 'Destination not found or invalid geometry'
        });
      }

      // 2. Encontra o ponto mais próximo nas rotas externas
      const nearestExternal = await externalService.findNearestExternalPoint(startArr);

      // 3. Encontra a porta/saída mais próxima (se houver)
      const nearestDoor = await externalService.findNearestDoorPoint(startArr);

      // 4. Retorna tudo junto
      return res.json({
        internalRoute: internalPath,
        externalContext: {
          nearestPoint: nearestExternal ? {
            coordinates: nearestExternal.nearestPoint,
            distance: nearestExternal.distance,
            routeId: nearestExternal.route.id,
            routeProperties: nearestExternal.route.properties
          } : null,
          nearestDoor: nearestDoor ? {
            coordinates: nearestDoor.doorPoint,
            distance: nearestDoor.distance,
            routeId: nearestDoor.route.id
          } : null
        },
        userPosition: startArr
      });

    } catch (err) {
      console.error('Error in getShortestToRoomWithExternalContext:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  async getShortestToRoom(req: Request, res: Response) {
    console.log('getShortestToRoom body:', req.body);

    const { roomId, structureId, floor, start, includeExternalContext } = req.body;

    if (structureId == null || floor == null || start == null) {
      return res.status(400).json({
        error: 'structureId, floor, start required'
      });
    }

    try {
      const service = new InternalRouteService();
      const startArr = Array.isArray(start)
        ? start.map(Number)
        : String(start).split(',').map(Number);

      // Chama o método com o novo parâmetro includeExternalContext
      // Ajusta para passar apenas os argumentos esperados
      let path;
      if (includeExternalContext !== undefined) {
        path = await service.findShortestRouteToDestination(
          Number(structureId),
          Number(floor),
          startArr,
          roomId ? Number(roomId) : undefined
        );
      } else {
        path = await service.findShortestRouteToDestination(
          Number(structureId),
          Number(floor),
          startArr,
          roomId ? Number(roomId) : undefined
        );
      }

      if (!path) {
        return res.status(404).json({
          error: 'Destination not found or invalid geometry'
        });
      }

      return res.json(path);

    } catch (err) {
      console.error('Error in getShortestToRoom:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}
