import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { Structure } from '../entities/Structure';
import {InternalRouteService} from '../services/InternalRouteService';

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
    const where: any = { };
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

  async getShortestToRoom(req: Request, res: Response) {
  console.log('getShortestToRoom body:', req.body);
    const { roomId, structureId, floor, start } = req.body;
    if (structureId == null || floor == null || start == null) {
      return res.status(400).json({ error: 'structureId, floor, start required' });
    }
    try {
      const service = new InternalRouteService();
      const startArr = Array.isArray(start) ? start.map(Number) : String(start).split(',').map(Number);
      const path = await service.findShortestRouteToDestination(Number(structureId), Number(floor), startArr, roomId ? Number(roomId) : undefined);
      if (!path) {
        return res.status(404).json({ error: 'Destination not found or invalid geometry' });
      }
      return res.json(path);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
