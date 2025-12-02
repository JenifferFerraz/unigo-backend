export interface EventRow {
  titulo: string;
  descricao: string;
  data_inicio: Date | string;
  data_fim?: Date | string;
  local?: string;
  tipo?: string;
  nome_curso?: string;
  link?: string;
}