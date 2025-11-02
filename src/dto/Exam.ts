export interface ExamRow {
  disciplina: string;
  professor: string;
  data: Date;
  horario: string;
  sala: string;
  dia?: string;
  curso?: string;
  turno?: string;
  ciclo?: number;
}
