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
import multer from 'multer';

class UploadService {

  private parseFile(file: multer.File, useRaw: boolean = false): any[] {
    try {
      const workbook = XLSX.read(file.buffer, { 
        type: 'buffer',
        cellDates: !useRaw, // Só converte datas se não usar raw
        cellNF: false,
        cellText: false,
      });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { 
        raw: useRaw, // Se true, mantém valores brutos (evita objetos Date problemáticos)
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
   * Converte data de diferentes formatos para string no formato yyyy-MM-dd
   * Suporta: Date objects, strings (dd/MM/yyyy, dd/MM/yy), números serial do Excel
   */
  private parseDate(dateValue: any): string {
    if (dateValue == null || dateValue === '') {
      throw new Error('Data não pode ser nula ou vazia');
    }

    // Se for Date object JavaScript válido
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        throw new Error('Data inválida');
      }
      const year = dateValue.getFullYear();
      if (year < 1900 || year > 2100) {
        throw new Error(`Ano inválido: ${year}`);
      }
      // Converter manualmente SEM usar toISOString (pode não existir em objetos Date do xlsx)
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Se for string
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      if (trimmed === '') {
        throw new Error('Data não pode ser vazia');
      }

      // Formato ISO yyyy-MM-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      // Formato brasileiro dd/MM/yyyy
      const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (brMatch) {
        const day = parseInt(brMatch[1], 10);
        const month = parseInt(brMatch[2], 10);
        const year = parseInt(brMatch[3], 10);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      // Formato brasileiro com ano de 2 dígitos dd/MM/yy
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

      // Tentar parsear como Date
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

    // Se for número (serial do Excel)
    if (typeof dateValue === 'number') {
      // Número serial do Excel: dias desde 1899-12-30
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
    // Processa apenas Excel/CSV
    // Usa raw: true para evitar objetos Date problemáticos do xlsx
    // As datas virão como números serial do Excel ou strings
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
        // Validações
        if (!row.disciplina || !row.data || !row.horario) {
          throw new Error('Campos obrigatórios faltando: disciplina, data, horario');
        }

        // Converter data para formato string yyyy-MM-dd
        let dateString: string;
        try {
          dateString = this.parseDate(row.data);
        } catch (dateError: any) {
          throw new Error(`Formato de data inválido na linha ${rowNumber}: ${dateError.message}`);
        }

        // Inserir no banco de dados
        const examRepository = AppDataSource.getRepository(Exam);
        
        // Truncar valores que excedam os limites do banco de dados
        const gradeValue = row.curso || row.nome_curso || null;
        const truncatedGrade = gradeValue && gradeValue.length > 100 ? gradeValue.substring(0, 100) : gradeValue;
        
        const shiftValue = row.turno || '';
        const truncatedShift = shiftValue.length > 20 ? shiftValue.substring(0, 20) : shiftValue;
        
        // Validar tamanho da data (deve ser yyyy-MM-dd = 10 caracteres, mas limite é 20)
        if (dateString.length > 20) {
          throw new Error(`Data convertida excede limite de 20 caracteres: ${dateString}`);
        }
        
        await examRepository.save({
          day: row.dia || '',
          date: dateString,
          subject: row.disciplina,
          time: row.horario,
          grade: truncatedGrade,
          shift: truncatedShift,
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
