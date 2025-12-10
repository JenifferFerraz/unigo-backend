import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Room } from '../entities/Room';

export class RoomController {
    static async getAll(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Room);
        const rawQuery = (req.query.search || req.query.q || '').toString();
        
        let rooms;
        if (rawQuery) {
            const normalized = rawQuery
                .toLowerCase()
                .replace(/\b(sala|laboratório|laboratorio|lab)\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();


            const searchTerms = normalized.split(' ').filter(t => t.length > 0);
            
            if (searchTerms.length > 0) {
                let query = repo.createQueryBuilder('room')
                    .where('room.isSearchable = :isSearchable', { isSearchable: true });

                // Buscar cada termo separadamente (AND)
                searchTerms.forEach((term, index) => {
                    query = query.andWhere(
                        `LOWER(REPLACE(REPLACE(room.name, 'SALA ', ''), 'LAB ', '')) LIKE :term${index}`,
                        { [`term${index}`]: `%${term}%` }
                    );
                });

                rooms = await query.getMany();

                console.log(`✅ Encontradas ${rooms.length} salas`);
                rooms.forEach(r => console.log(`   - ${r.name} (ID: ${r.id})`));
            } else {
                rooms = [];
            }
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
