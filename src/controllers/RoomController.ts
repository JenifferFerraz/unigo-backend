import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Room } from '../entities/Room';

export class RoomController {
    static async getAll(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Room);
        const q = (req.query.search || req.query.q || '').toString().toLowerCase();
        let rooms;
        if (q) {
            rooms = await repo.createQueryBuilder('room')
                .where('LOWER(room.name) LIKE :q', { q: `%${q}%` })
                .andWhere('room.isSearchable = :isSearchable', { isSearchable: true })
                .getMany();
        } else {
            rooms = await repo.find({ where: { isSearchable: true } });
        }
        res.json(rooms);
    }

    static async getById(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Room);
        const room = await repo.findOne({ where: { id: Number(req.params.id) } });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.json(room);
    }

    static async delete(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Room);
        const room = await repo.findOne({ where: { id: Number(req.params.id) } });
        if (!room) return res.status(404).json({ message: 'Room not found' });
        await repo.remove(room);
        res.status(204).send();
    }
}
