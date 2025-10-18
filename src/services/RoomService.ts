import { AppDataSource } from '../config/data-source';
import { Room } from '../entities/Room';

export class RoomService {
    static async getAll() {
        const repo = AppDataSource.getRepository(Room);
        return repo.find();
    }

    static async getById(id: number) {
        const repo = AppDataSource.getRepository(Room);
        return repo.findOne({ where: { id } });
    }

    static async create(data: Partial<Room>) {
        const repo = AppDataSource.getRepository(Room);
        const room = repo.create(data);
        return repo.save(room);
    }

    static async update(id: number, data: Partial<Room>) {
        const repo = AppDataSource.getRepository(Room);
        const room = await repo.findOne({ where: { id } });
        if (!room) return null;
        repo.merge(room, data);
        return repo.save(room);
    }

    static async delete(id: number) {
        const repo = AppDataSource.getRepository(Room);
        const room = await repo.findOne({ where: { id } });
        if (!room) return false;
        await repo.remove(room);
        return true;
    }
}