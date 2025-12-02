export interface ScheduleRow {
  disciplina: string;
  professor: string;
  horario: string | Date | number;
  sala: string;
  dia_semana: string;
  curso?: string;
  nome_curso?: string;
  turno?: string;
  semestre?: number | string;
}

export interface UploadResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}