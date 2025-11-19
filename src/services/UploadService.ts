import * as XLSX from 'xlsx';
import { AppDataSource } from '../config/data-source';
import { Schedule } from '../entities/Schedule';
import { Event } from '../entities/Event';
import { AcademicCalendar } from '../entities/AcademicCalendar';
import { Exam } from '../entities/Exam';
import { ScheduleRow, UploadResult } from '../dto/Schedule';
import { EventRow } from '../dto/Event';
import { CalendarRow } from '../dto/AcademicCalendar';
import { ExamRow } from '../dto/Exam';
import { link } from 'fs';

class UploadService {
  /**
   * Processa arquivo Excel/CSV e retorna os dados
   */
  private parseFile(file: Multer.File): any[] {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      return data;
    } catch (error) {
      throw new Error('Erro ao ler arquivo. Verifique se o formato está correto.');
    }
  }

  /**
   * Valida e importa horários
   */
  async processScheduleFile(file: Multer.File): Promise<UploadResult> {
    const rows = this.parseFile(file);
    const result: UploadResult = {
      totalRows: rows.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as ScheduleRow;
      const rowNumber = i + 2; 

      try {
        // Validações
        if (!row.disciplina || !row.professor || !row.horario || !row.sala || !row.dia_semana) {
          throw new Error('Campos obrigatórios faltando: disciplina, professor, horario, sala, dia_semana');
        }

        // Buscar o curso pelo nome
        let courseEntity = undefined;
        if (row.curso) {
          const courseRepository = AppDataSource.getRepository('Course');
          courseEntity = await courseRepository.findOne({ where: { name: row.curso } });
          if (!courseEntity) {
            throw new Error(`Curso não encontrado: ${row.curso}`);
          }
        }

        // Inserir no banco de dados
        const scheduleRepository = AppDataSource.getRepository(Schedule);
        await scheduleRepository.save({
          subject: row.disciplina,
          professor: row.professor,
          time: row.horario,
          room: row.sala,
          dayOfWeek: row.dia_semana,
          course: courseEntity,
          shift: row.turno,
          semester: row.semestre || 1,
        });

        result.successCount++;
      } catch (error: any) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      }
    }

    if (result.errorCount > 0) {
      throw {
        message: `${result.errorCount} erro(s) encontrado(s) durante a importação.`,
        errors: result.errors,
      };
    }

    return result;
  }

  /**
   * Valida e importa eventos
   */
  async processEventsFile(file: Multer.File): Promise<UploadResult> {
    const rows = this.parseFile(file);
    const result: UploadResult = {
      totalRows: rows.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as EventRow;
      const rowNumber = i + 2;

      try {
        // Validações
        if (!row.titulo || !row.descricao || !row.data_inicio) {
          throw new Error('Campos obrigatórios faltando: titulo, descricao, data_inicio');
        }

        // Validar formato de data
        if (!(row.data_inicio instanceof Date) && isNaN(Date.parse(row.data_inicio as any))) {
          throw new Error('Formato de data inválido para data_inicio');
        }

        // Buscar o curso pelo nome
        let courseEntity = undefined;
        if (row.nome_curso) {
          const courseRepository = AppDataSource.getRepository('Course');
          courseEntity = await courseRepository.findOne({ where: { name: row.nome_curso } });
          console.log('[processEventsFile] courseEntity:', courseEntity);
          if (!courseEntity) {
            throw new Error(`Curso não encontrado: ${row.nome_curso}`);
          }
        }

        // Inserir no banco de dados
        const eventRepository = AppDataSource.getRepository(Event);
        const eventData = {
          title: row.titulo,
          description: row.descricao,
          startDate: new Date(row.data_inicio),
          endDate: row.data_fim ? new Date(row.data_fim) : undefined,
          location: row.local,
          type: row.tipo || 'academico',
          course: courseEntity,
          link: row.link
        };
        console.log('[processEventsFile] eventData:', eventData);
        await eventRepository.save(eventData);

        result.successCount++;
      } catch (error: any) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      }
    }

    if (result.errorCount > 0) {
      throw {
        message: `${result.errorCount} erro(s) encontrado(s) durante a importação.`,
        errors: result.errors,
      };
    }

    return result;
  }

  /**
   * Valida e importa calendário acadêmico
   */
  async processCalendarFile(file: Multer.File): Promise<UploadResult> {
    const rows = this.parseFile(file);
    const result: UploadResult = {
      totalRows: rows.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as CalendarRow;
      const rowNumber = i + 2;

      try {
        // Validações
        if (!row.titulo || !row.data || !row.tipo) {
          throw new Error('Campos obrigatórios faltando: titulo, data, tipo');
        }

        // Validar formato de data
        if (!(row.data instanceof Date) && isNaN(Date.parse(row.data as any))) {
          throw new Error('Formato de data inválido');
        }

        // Inserir no banco de dados
        const calendarRepository = AppDataSource.getRepository(AcademicCalendar);
        await calendarRepository.save({
          title: row.titulo,
          date: new Date(row.data),
          type: row.tipo,
          description: row.descricao,
          semester: row.semestre,
          year: row.ano,
        });

        result.successCount++;
      } catch (error: any) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      }
    }

    if (result.errorCount > 0) {
      throw {
        message: `${result.errorCount} erro(s) encontrado(s) durante a importação.`,
        errors: result.errors,
      };
    }

    return result;
  }

  /**
   * Valida e importa provas
   */
  async processExamsFile(file: Multer.File): Promise<UploadResult> {
    const rows = this.parseFile(file);
    const result: UploadResult = {
      totalRows: rows.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as ExamRow;
      const rowNumber = i + 2;

      try {
        // Validações
        if (!row.disciplina || !row.professor || !row.data || !row.horario || !row.sala) {
          throw new Error('Campos obrigatórios faltando: disciplina, professor, data, horario, sala');
        }

        // Validar formato de data
        if (!(row.data instanceof Date) && isNaN(Date.parse(row.data as any))) {
          throw new Error('Formato de data inválido');
        }

        // Inserir no banco de dados
        const examRepository = AppDataSource.getRepository(Exam);
        await examRepository.save({
          day: row.dia || '',
          date: typeof row.data === 'string' ? row.data : row.data.toISOString().split('T')[0],
          subject: row.disciplina,
          time: row.horario,
          grade: row.curso,
          shift: row.turno,
          cycle: row.ciclo || 1,
        });

        result.successCount++;
      } catch (error: any) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          message: error.message,
        });
      }
    }

    if (result.errorCount > 0) {
      throw {
        message: `${result.errorCount} erro(s) encontrado(s) durante a importação.`,
        errors: result.errors,
      };
    }

    return result;
  }

  /**
   * Retorna o caminho do template solicitado
   */
  async getTemplatePath(type: string): Promise<string> {
    const path = require('path');
    const templatesDir = path.join(__dirname, '../../templates');
    
    const templateMap: Record<string, string> = {
      schedule: 'planilha_modelo_horarios.xlsx',
      events: 'planilha_modelo_eventos.xlsx',
      calendar: 'planilha_modelo_calendario.xlsx',
      exams: 'planilha_modelo_provas.xlsx',
    };

    const filename = templateMap[type];
    if (!filename) {
      throw new Error('Template não encontrado.');
    }

    const fullPath = path.join(templatesDir, filename);
    console.log('[UploadService] Template path:', fullPath);
    return fullPath;
  }
}

export default new UploadService();
