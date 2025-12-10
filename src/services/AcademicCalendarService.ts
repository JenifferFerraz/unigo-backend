import { AppDataSource } from '../config/data-source';
import { AcademicCalendar } from '../entities/AcademicCalendar';

interface AcademicCalendarFilters {
  type?: string;
  isActive?: boolean;
  semester?: number;
  year?: number;
  month?: number;
  course?: string;
  courseId?: number;
}

class AcademicCalendarService {
    /**
     * Atualizar evento do calendário
     */
    async update(id: number, updateData: any): Promise<AcademicCalendar | null> {
      const repository = AppDataSource.getRepository(AcademicCalendar);
      const event = await repository.findOneBy({ id });
      if (!event) return null;
      repository.merge(event, updateData);
      return await repository.save(event);
    }
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
      queryBuilder.andWhere('EXTRACT(YEAR FROM calendar.date) = :year', { year: filters.year });
    }

    if (filters.month) {
      queryBuilder.andWhere('EXTRACT(MONTH FROM calendar.date) = :month', { month: filters.month });
    }

    if (filters.course) {
      queryBuilder.andWhere('calendar.course = :course', { course: filters.course });
    }

    if (filters.courseId !== undefined && filters.courseId !== null) {
      // Garante que courseId é número
      const courseIdNum = typeof filters.courseId === 'string' ? parseInt(filters.courseId, 10) : filters.courseId;
      // Busca eventos do curso específico OU eventos gerais (courseId null)
      queryBuilder.andWhere('(calendar.courseId = :courseId OR calendar.courseId IS NULL)', { courseId: courseIdNum });
    }

    queryBuilder.orderBy('calendar.date', 'ASC');

    const result = await queryBuilder.getMany();
    return result;
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
