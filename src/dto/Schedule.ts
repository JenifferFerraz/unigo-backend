export interface ScheduleRow {
  disciplina: string;
  professor: string;
  horario: string;
  sala: string;
  dia_semana: string;
  curso?: string;
  turno?: string;
  semestre?: number;
}

export interface UploadResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}
