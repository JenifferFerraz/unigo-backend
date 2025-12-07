import * as XLSX from 'xlsx';
import { AppDataSource } from '../config/data-source';
import { Schedule } from '../entities/Schedule';
import { Event } from '../entities/Event';
import { AcademicCalendar } from '../entities/AcademicCalendar';
import { Exam } from '../entities/Exam';
import { Course } from '../entities/Course';
import { ScheduleRow, UploadResult } from '../dto/Schedule';
import { EventRow } from '../dto/Event';
import { CalendarRow } from '../dto/AcademicCalendar';
import { ExamRow } from '../dto/Exam';
import multer from 'multer';

class UploadService {

  private parseFile(file: multer.File, useRaw: boolean = false): any[] {
    try {
      const workbook = XLSX.read(file.buffer, { 
        type: 'buffer',
        cellDates: !useRaw, 
        cellNF: false,
        cellText: false,
      });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { 
        raw: useRaw,
        defval: null,
      });
      return data;
    } catch (error) {
      throw new Error('Erro ao ler arquivo. Verifique se o formato está correto.');
    }
  }

  /**
   * Valida e importa horários
   */
  async processScheduleFile(file: multer.File): Promise<UploadResult> {
    const rows = this.parseFile(file, true);
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
        if (!row.disciplina || !row.professor || !row.horario || !row.sala || !row.dia_semana) {
          throw new Error('Campos obrigatórios faltando: disciplina, professor, horario, sala, dia_semana');
        }

        let courseId = undefined;
        let courseName = row.curso || row.nome_curso;
        if (courseName) {
          const normalize = (str: string) => str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
          const normalizedCourseName = normalize(courseName);
          const courseRepository = AppDataSource.getRepository('Course');
          const allCourses = await courseRepository.find();
          const foundCourse = allCourses.find(c => normalize(c.name) === normalizedCourseName);
          if (!foundCourse) {
            throw new Error(`Curso não encontrado: ${courseName}`);
          }
          courseId = foundCourse.id;
        }

        let semestreNum = 1;
        if (row.semestre) {
          if (typeof row.semestre === 'string') {
            const match = (row.semestre as string).match(/(\d+)/);
            semestreNum = match ? parseInt(match[1], 10) : 1;
          } else if (typeof row.semestre === 'number') {
            semestreNum = row.semestre;
          }
        }

        let horarioStr = '';
        if (row.horario === null || row.horario === undefined) {
          horarioStr = '';
        } else if (Object.prototype.toString.call(row.horario) === '[object Date]') {
          const h = (row.horario as Date).getHours().toString().padStart(2, '0');
          const m = (row.horario as Date).getMinutes().toString().padStart(2, '0');
          const s = (row.horario as Date).getSeconds().toString().padStart(2, '0');
          horarioStr = `${h}:${m}:${s}`;
        } else if (typeof row.horario === 'number') {
          const totalSeconds = Math.round(row.horario * 24 * 60 * 60);
          const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
          const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
          const s = (totalSeconds % 60).toString().padStart(2, '0');
          horarioStr = `${h}:${m}:${s}`;
        } else if (typeof row.horario === 'string') {
          horarioStr = row.horario.trim();
        } else {
          horarioStr = String(row.horario);
        }

        const scheduleRepository = AppDataSource.getRepository(Schedule);
        await scheduleRepository.save({
          subject: row.disciplina,
          professor: row.professor,
          time: horarioStr,
          room: row.sala,
          dayOfWeek: row.dia_semana,
          courseId: courseId,
          courseName: courseName || null,
          shift: row.turno,
          semester: semestreNum,
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
  async processEventsFile(file: multer.File): Promise<UploadResult> {
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
        if (!row.titulo || !row.descricao || !row.data_inicio) {
          throw new Error('Campos obrigatórios faltando: titulo, descricao, data_inicio');
        }

        if (!(row.data_inicio instanceof Date)) {
          const dateString = String(row.data_inicio);
          if (isNaN(Date.parse(dateString))) {
            throw new Error('Formato de data inválido para data_inicio');
          }
        }

        let courseEntity = undefined;
        if (row.nome_curso) {
          const courseRepository = AppDataSource.getRepository('Course');
          courseEntity = await courseRepository.findOne({ where: { name: row.nome_curso } });
          if (!courseEntity) {
            throw new Error(`Curso não encontrado: ${row.nome_curso}`);
          }
        }


        const eventRepository = AppDataSource.getRepository(Event);
        let startDate: Date | undefined = undefined;
        let endDate: Date | undefined = undefined;
        
  
        if (row.data_inicio instanceof Date) {
          startDate = row.data_inicio;
        } else if (typeof row.data_inicio === 'string') {
          startDate = new Date(row.data_inicio);
        } else if (row.data_inicio) {
      
          startDate = new Date(String(row.data_inicio));
        }
        
        if (row.data_fim instanceof Date) {
          endDate = row.data_fim;
        } else if (typeof row.data_fim === 'string') {
          endDate = new Date(row.data_fim);
        } else if (row.data_fim) {

          endDate = new Date(String(row.data_fim));
        }
        
        const eventData = {
          title: row.titulo,
          description: row.descricao,
          startDate,
          endDate,
          location: row.local,
          type: row.tipo || 'academico',
          course: courseEntity,
          link: row.link
        };
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
  async processCalendarFile(file: multer.File): Promise<UploadResult> {
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
        if (!row.titulo || !row.data || !row.tipo) {
          throw new Error('Campos obrigatórios faltando: titulo, data, tipo');
        }

        if (!(row.data instanceof Date) && isNaN(Date.parse(row.data as any))) {
          throw new Error('Formato de data inválido');
        }

        let courseId = undefined;
        let courseName = row.curso || row.nome_curso;
        if (courseName) {
          const normalize = (str: string) => str
            .normalize('NFD')
            .replace(/[ -]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
          const normalizedCourseName = normalize(courseName);
          const courseRepository = AppDataSource.getRepository('Course');
          const allCourses = await courseRepository.find();
          const foundCourse = allCourses.find(c => normalize(c.name) === normalizedCourseName);
          if (!foundCourse) {
            throw new Error(`Curso não encontrado: ${courseName}`);
          }
          courseId = foundCourse.id;
          courseName = foundCourse.name;
        }

        const calendarRepository = AppDataSource.getRepository(AcademicCalendar);
        await calendarRepository.save({
          title: row.titulo,
          date: new Date(row.data),
          type: row.tipo,
          description: row.descricao,
          semester: row.semestre,
          year: row.ano,
          courseId: courseId,
          course: courseName || null,
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
  

  private parseDate(dateValue: any): string {
    if (dateValue == null || dateValue === '') {
      throw new Error('Data não pode ser nula ou vazia');
    }

    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        throw new Error('Data inválida');
      }
      const year = dateValue.getFullYear();
      if (year < 1900 || year > 2100) {
        throw new Error(`Ano inválido: ${year}`);
      }
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }


    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      if (trimmed === '') {
        throw new Error('Data não pode ser vazia');
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }


      const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (brMatch) {
        const day = parseInt(brMatch[1], 10);
        const month = parseInt(brMatch[2], 10);
        const year = parseInt(brMatch[3], 10);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      const brMatch2 = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
      if (brMatch2) {
        const day = parseInt(brMatch2[1], 10);
        const month = parseInt(brMatch2[2], 10);
        const year2Digits = parseInt(brMatch2[3], 10);
        const year = year2Digits <= 50 ? 2000 + year2Digits : 1900 + year2Digits;
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        if (year >= 1900 && year <= 2100) {
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }

      throw new Error(`Formato de data inválido: "${trimmed}". Formatos aceitos: dd/MM/yyyy, dd/MM/yy, yyyy-MM-dd`);
    }


    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        if (year >= 1900 && year <= 2100) {
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
    }

    throw new Error(`Tipo de data não suportado: ${typeof dateValue} (valor: ${dateValue})`);
  }

  async processExamsFile(file: multer.File): Promise<UploadResult> {

    const rows = this.parseFile(file, true);

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
        if (!row.disciplina || !row.data || !row.horario) {
          throw new Error('Campos obrigatórios faltando: disciplina, data, horario');
        }

        let dateString: string;
        try {
          dateString = this.parseDate(row.data);
        } catch (dateError: any) {
          throw new Error(`Formato de data inválido na linha ${rowNumber}: ${dateError.message}`);
        }

        // Buscar curso pelo nome
        let courseEntity = undefined;
        let courseId = undefined;
        let courseName = row.curso || row.nome_curso;
        
        if (courseName) {
          const normalize = (str: string) => str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
          const normalizedCourseName = normalize(courseName);
          const courseRepository = AppDataSource.getRepository(Course);
          const allCourses = await courseRepository.find();
          const foundCourse = allCourses.find(c => normalize(c.name) === normalizedCourseName);
          
          if (foundCourse) {
            courseEntity = foundCourse;
            courseId = foundCourse.id;
          }
        }

        const examRepository = AppDataSource.getRepository(Exam);
        
        // Extrai o período do campo disciplina 
        // Suporta: (1º), (2º/3º/6º), (3º / 4º), etc
        let gradeValue = null;
        const subjectMatch = row.disciplina.match(/\(([^\)]+)\)$/);
        if (subjectMatch) {
          gradeValue = subjectMatch[1].trim();
        }
        
        const shiftValue = row.turno || '';
        const normalizedShift = shiftValue.toLowerCase().trim();
        const truncatedShift = normalizedShift.length > 20 ? normalizedShift.substring(0, 20) : normalizedShift;
        
        if (dateString.length > 20) {
          throw new Error(`Data convertida excede limite de 20 caracteres: ${dateString}`);
        }
        
        // Extrai o ciclo da string "Ciclo 1" para o número 1
        let cycleValue = 1;
        if (row.ciclo) {
          const cycleMatch = String(row.ciclo).match(/\d+/);
          if (cycleMatch) {
            cycleValue = parseInt(cycleMatch[0], 10);
          }
        }
        
        const examData = {
          day: row.dia || '',
          date: dateString,
          subject: row.disciplina,
          time: row.horario,
          grade: gradeValue,
          shift: truncatedShift,
          cycle: cycleValue,
          courseId: courseId,
          course: courseEntity,
        };
        
        await examRepository.save(examData);

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
    return fullPath;
  }
}

export default new UploadService();