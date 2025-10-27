export interface CreateFeedbackDto {
  // Parte 1: Perfil
  vinculo: 'aluno' | 'visitante' | 'funcionario';
  jaUsouAppInterno: boolean;
  identificarLocalizacao: number; // 1-5
  instrucoesClaras: number; // 1-5

  // Parte 2: Usabilidade
  representacaoFiel: number; // 1-5
  trajetoFacilSeguir: number; // 1-5
  facilUsar: number; // 1-5
  designClaro: number; // 1-5
  interacaoSemDificuldade: number; // 1-5

  // Parte 3: Satisfação
  tempoRazoavel: number; // 1-5
  confiancaDestino: number; // 1-5
  recomendaria: number; // 1-5
  voltariaUsar: number; // 1-5
  satisfacaoGeral: number; // 1-5

  // Parte 4: Perguntas Abertas (opcionais)
  oQueAgradou?: string;
  dificuldadesEncontradas?: string;
  sugestoesMelhoria?: string;

  // Metadados opcionais
  deviceInfo?: string;
  appVersion?: string;
}

export interface FeedbackStatsDto {
  totalFeedbacks: number;
  byVinculo: {
    aluno: number;
    visitante: number;
    funcionario: number;
  };
  byAnonymous: {
    anonymous: number;
    identified: number;
  };
  averageScores: {
    identificarLocalizacao: number;
    instrucoesClaras: number;
    representacaoFiel: number;
    trajetoFacilSeguir: number;
    facilUsar: number;
    designClaro: number;
    interacaoSemDificuldade: number;
    tempoRazoavel: number;
    confiancaDestino: number;
    recomendaria: number;
    voltariaUsar: number;
    satisfacaoGeral: number;
  };
  nps: number; // Net Promoter Score baseado em "recomendaria"
}
