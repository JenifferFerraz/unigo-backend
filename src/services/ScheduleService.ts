import { AppDataSource } from '../config/data-source';
import { Schedule } from '../entities/Schedule';

interface ScheduleFilters {
  course?: string;
  shift?: string;
  dayOfWeek?: string;
  semester?: number;
  courseId?: number;
}

class ScheduleService {
  /**
   * Buscar todos os horários com filtros opcionais
   */
  async findAll(filters: ScheduleFilters): Promise<any[]> {
    const repository = AppDataSource.getRepository(Schedule);
    const roomRepo = AppDataSource.getRepository('Room');
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

    if (filters.courseId) {
      queryBuilder.andWhere('schedule.courseId = :courseId', { courseId: filters.courseId });
    }

    queryBuilder.orderBy('schedule.dayOfWeek', 'ASC');
    queryBuilder.addOrderBy('schedule.time', 'ASC');

    const schedules = await queryBuilder.getMany();

    const enriched = await Promise.all(schedules.map(async s => {
      let roomId = null;
      let structureId = null;
      if (s.room) {
        console.log(`[ScheduleService] Procurando room: '${s.room}'`);
        
        // Normaliza o nome da sala do schedule (remove prefixos comuns)
        const normalized = s.room
          .toLowerCase()
          .replace(/\b(sala|laboratório|laboratorio|lab)\b/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Tenta busca exata primeiro
        let room = await roomRepo.createQueryBuilder('room')
          .where('LOWER(room.name) = LOWER(:name)', { name: s.room })
          .getOne();

        // Se não encontrou, tenta busca normalizada
        if (!room && normalized) {
          const searchTerms = normalized.split(' ').filter(t => t.length > 0);
          
          if (searchTerms.length > 0) {
            let qb = roomRepo.createQueryBuilder('room');
            
            searchTerms.forEach((term, idx) => {
              const paramName = `term${idx}`;
              qb = qb.andWhere(
                `(LOWER(REPLACE(REPLACE(REPLACE(REPLACE(room.name, 'SALA ', ''), 'LABORATÓRIO ', ''), 'LABORATORIO ', ''), 'LAB ', '')) LIKE :${paramName})`,
                { [paramName]: `%${term}%` }
              );
            });
            
            room = await qb.getOne();
          }
        }
        
        if (room) {
          roomId = room.id;
          structureId = room.structureId;
          console.log(`[ScheduleService] ✓ Encontrado: ${room.name} (ID: ${roomId})`);
        } else {
          console.log(`[ScheduleService] ✗ Não encontrado: '${s.room}' (normalizado: '${normalized}')`);
        }
      }
      return {
        ...s,
        roomId,
        structureId,
      };
    }));
    return enriched;
  }

  /**
   * Buscar horários e número de períodos do curso
   */
  async findAllWithPeriods(filters: ScheduleFilters): Promise<{ schedules: Schedule[]; periods: number }>
  {
    const schedules = await this.findAll(filters);
    let periods = 0;
    if (filters.courseId) {
      const courseRepo = AppDataSource.getRepository('Course');
      const course = await courseRepo.findOne({ where: { id: filters.courseId } });
      if (course && course.period) {
        periods = course.period;
      }
    }
    return { schedules, periods };
  }

  /**
   * Buscar horário por ID
   */
  async findById(id: number): Promise<Schedule | null> {
    const repository = AppDataSource.getRepository(Schedule);
    return await repository.findOneBy({ id });
  }

  /**
   * Atualizar horário
   */
  async update(id: number, updateData: any): Promise<Schedule | null> {
    const repository = AppDataSource.getRepository(Schedule);
    const schedule = await repository.findOneBy({ id });
    
    if (!schedule) {
      return null;
    }

    // Merge dos dados atualizados
    repository.merge(schedule, updateData);
    return await repository.save(schedule);
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
