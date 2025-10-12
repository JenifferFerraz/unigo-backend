import { AppDataSource } from '../config/data-source';
import { Exam } from '../entities/Exam';

class ExamService {
    public async findAll(cycle?: number, shift?: string): Promise<Exam[]> {
        const repo = AppDataSource.getRepository(Exam);
        const where: any = {};
        if (typeof cycle === 'number') where.cycle = cycle;
        if (shift) where.shift = shift;
        if (Object.keys(where).length > 0) {
            return await repo.find({ where });
        }
        return await repo.find();
    }
}

export default new ExamService();
