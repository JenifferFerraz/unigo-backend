export interface EventRow {
  titulo: string;
  descricao: string;
  data_inicio: Date;
  data_fim?: Date;
  local?: string;
  tipo?: string;
  nome_curso?: string; 
  link?: string;
}
