import { AppDataSource } from '../config/data-source';
import { AcademicCalendar } from '../entities/AcademicCalendar';

interface AcademicCalendarFilters {
  type?: string;
  isActive?: boolean;
  semester?: number;
  year?: number;
  month?: number;
}

class AcademicCalendarService {
  /**
   * Buscar todos os eventos do calendário com filtros opcionais
   */
  async findAll(filters: AcademicCalendarFilters): Promise<AcademicCalendar[]> {
    const repository = AppDataSource.getRepository(AcademicCalendar);
    const queryBuilder = repository.createQueryBuilder('calendar');

    if (filters.type) {
      queryBuilder.andWhere('calendar.type = :type', { type: filters.type });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('calendar.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters.semester) {
      queryBuilder.andWhere('calendar.semester = :semester', { semester: filters.semester });
    }

    if (filters.year) {
      queryBuilder.andWhere('calendar.year = :year', { year: filters.year });
    }

    if (filters.month) {
      queryBuilder.andWhere('EXTRACT(MONTH FROM calendar.date) = :month', { month: filters.month });
    }

    queryBuilder.orderBy('calendar.date', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Buscar evento do calendário por ID
   */
  async findById(id: number): Promise<AcademicCalendar | null> {
    const repository = AppDataSource.getRepository(AcademicCalendar);
    return await repository.findOneBy({ id });
  }

  /**
   * Deletar evento do calendário
   */
  async delete(id: number): Promise<void> {
    const repository = AppDataSource.getRepository(AcademicCalendar);
    await repository.delete(id);
  }
}

export default new AcademicCalendarService();
