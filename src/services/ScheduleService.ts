import { AppDataSource } from '../config/data-source';
import { Schedule } from '../entities/Schedule';

interface ScheduleFilters {
  course?: string;
  shift?: string;
  dayOfWeek?: string;
  semester?: number;
}

class ScheduleService {
  /**
   * Buscar todos os horários com filtros opcionais
   */
  async findAll(filters: ScheduleFilters): Promise<Schedule[]> {
    const repository = AppDataSource.getRepository(Schedule);
    const queryBuilder = repository.createQueryBuilder('schedule');

    if (filters.course) {
      queryBuilder.andWhere('schedule.course = :course', { course: filters.course });
    }

    if (filters.shift) {
      queryBuilder.andWhere('schedule.shift = :shift', { shift: filters.shift });
    }

    if (filters.dayOfWeek) {
      queryBuilder.andWhere('schedule.dayOfWeek = :dayOfWeek', { dayOfWeek: filters.dayOfWeek });
    }

    if (filters.semester) {
      queryBuilder.andWhere('schedule.semester = :semester', { semester: filters.semester });
    }

    queryBuilder.orderBy('schedule.dayOfWeek', 'ASC');
    queryBuilder.addOrderBy('schedule.time', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Buscar horário por ID
   */
  async findById(id: number): Promise<Schedule | null> {
    const repository = AppDataSource.getRepository(Schedule);
    return await repository.findOneBy({ id });
  }

  /**
   * Deletar horário
   */
  async delete(id: number): Promise<void> {
    const repository = AppDataSource.getRepository(Schedule);
    await repository.delete(id);
  }
}

export default new ScheduleService();
