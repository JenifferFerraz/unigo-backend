import { Course } from "@entities/Course";

export interface ExamRow {
  disciplina: string;
  professor: string;
  data: Date | string | number;
  horario: string;
  sala: string;
  dia?: string;
  curso?: string;
  nome_curso?: string; 
  turno?: string;
  ciclo?: number;
  course?: Course;
}
