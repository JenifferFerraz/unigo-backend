import { AppDataSource } from '../config/data-source';
import { Event } from '../entities/Event';
import { MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';

interface EventFilters {
  type?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  courseId?: number;
}

class EventService {
    /**
     * Atualizar evento
     */
    async update(id: number, updateData: any): Promise<Event | null> {
      const repository = AppDataSource.getRepository(Event);
      const event = await repository.findOneBy({ id });
      if (!event) return null;

      // Corrige datas se vierem como string
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }

      repository.merge(event, updateData);
      return await repository.save(event);
    }
  /**
   * Buscar todos os eventos com filtros opcionais
   */
  async findAll(filters: EventFilters): Promise<Event[]> {
    const repository = AppDataSource.getRepository(Event);
    const queryBuilder = repository.createQueryBuilder('event');

    if (filters.type) {
      queryBuilder.andWhere('event.type = :type', { type: filters.type });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('event.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('event.startDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (filters.startDate) {
      queryBuilder.andWhere('event.startDate >= :startDate', { startDate: filters.startDate });
    } else if (filters.endDate) {
      queryBuilder.andWhere('event.startDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.courseId) {
      queryBuilder.andWhere('event.courseId = :courseId', { courseId: filters.courseId });
    }

    queryBuilder.orderBy('event.startDate', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Buscar evento por ID
   */
  async findById(id: number): Promise<Event | null> {
    const repository = AppDataSource.getRepository(Event);
    return await repository.findOneBy({ id });
  }

  /**
   * Deletar evento
   */
  async delete(id: number): Promise<void> {
    const repository = AppDataSource.getRepository(Event);
    await repository.delete(id);
  }
}

export default new EventService();
