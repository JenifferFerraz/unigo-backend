import { Request, Response } from 'express';
import { StructureService } from '../services/StructureService';

export class StructureController {
  static async getNearest(req: Request, res: Response) {
    const { lat, lng, maxDistance } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });
    const service = new StructureService();
    const result = await service.getNearestStructure(Number(lat), Number(lng), Number(maxDistance) || 10);
    res.json(result);
  }

  static async getAll(req: Request, res: Response) {
    const service = new StructureService();
    const { search } = req.query;
    let all;
    if (typeof search === 'string' && search.trim() !== '') {
      all = await service.getAllStructures(search);
    } else {
      all = await service.getAllStructures();
    }
    res.json(all);
  }

  

  static async getById(req: Request, res: Response) {
    const service = new StructureService();
    const item = await service.getStructureById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  }
}