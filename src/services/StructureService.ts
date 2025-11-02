import { AppDataSource } from '../config/data-source';
import { Structure } from '../entities/Structure';

export class StructureService {
    private structureRepo = AppDataSource.getRepository(Structure);

    async createStructure(data: Partial<Structure>) {
        const structure = this.structureRepo.create(data);
        return await this.structureRepo.save(structure);
    }

    async getAllStructures(search?: string) {
        if (search && search.trim() !== '') {
            return await this.structureRepo.createQueryBuilder('structure')
                .where('LOWER(structure.name) LIKE :q', { q: `%${search.toLowerCase()}%` }).getMany();
        }
        return await this.structureRepo.find();
    }

    async getNearestStructure(lat: number, lng: number, maxDistance = 10) {
        const userPoint = `SRID=4326;POINT(${lng} ${lat})`;
        return await this.structureRepo
            .createQueryBuilder('structure')
            .where('ST_DWithin(structure.centroid, ST_GeomFromText(:userPoint), :maxDistance)', { userPoint, maxDistance })
            .getOne();
    }
    async getStructureById(id: number) {
        return await this.structureRepo.findOne({ where: { id } });
    }
}
