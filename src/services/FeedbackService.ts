import { AppDataSource } from '../config/data-source';
import { Feedback } from '../entities/Feedback';
import { CreateFeedbackDto, FeedbackStatsDto } from '../dto/Feedback';
import { Between } from 'typeorm';

interface FeedbackFilters {
  vinculo?: string;
  isAnonymous?: boolean;
  startDate?: string;
  endDate?: string;
}

class FeedbackService {
  /**
   * Sanitiza strings para prevenir SQL Injection e XSS
   */
  private sanitizeString(input: string | null | undefined): string | null {
    if (!input || typeof input !== 'string') return null;
    
    // Remove comandos SQL perigosos
    let sanitized = input
      .replace(/('|(\\')|(;)|(\\;)|(--)|(\*\/)|(\*\/)|(\*\/)|(\*\/))/gi, '')
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ALERT)\b/gi, '')
      .replace(/[<>{}]/g, ''); // Remove tags HTML/XML
    
    // Limita o tamanho
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000);
    }
    
    return sanitized.trim() || null;
  }

  /**
   * Criar novo feedback
   */
  async createFeedback(data: CreateFeedbackDto & { userId?: number | null; isAnonymous: boolean }): Promise<Feedback> {
    // Validar scores (1-5)
    const scores = [
      data.identificarLocalizacao,
      data.instrucoesClaras,
      data.representacaoFiel,
      data.trajetoFacilSeguir,
      data.facilUsar,
      data.designClaro,
      data.interacaoSemDificuldade,
      data.tempoRazoavel,
      data.confiancaDestino,
      data.recomendaria,
      data.voltariaUsar,
      data.satisfacaoGeral,
    ];

    for (const score of scores) {
      if (score < 1 || score > 5) {
        throw new Error('Todas as avaliações devem estar entre 1 e 5');
      }
    }

    // Validar vínculo
    if (!['aluno', 'visitante', 'funcionario'].includes(data.vinculo)) {
      throw new Error('Vínculo inválido');
    }

    const feedbackRepository = AppDataSource.getRepository(Feedback);

    const feedback = feedbackRepository.create({
      userId: data.userId || null,
      isAnonymous: data.isAnonymous,
      vinculo: data.vinculo,
      jaUsouAppInterno: data.jaUsouAppInterno,
      identificarLocalizacao: data.identificarLocalizacao,
      instrucoesClaras: data.instrucoesClaras,
      representacaoFiel: data.representacaoFiel,
      trajetoFacilSeguir: data.trajetoFacilSeguir,
      facilUsar: data.facilUsar,
      designClaro: data.designClaro,
      interacaoSemDificuldade: data.interacaoSemDificuldade,
      tempoRazoavel: data.tempoRazoavel,
      confiancaDestino: data.confiancaDestino,
      recomendaria: data.recomendaria,
      voltariaUsar: data.voltariaUsar,
      satisfacaoGeral: data.satisfacaoGeral,
      oQueAgradou: this.sanitizeString(data.oQueAgradou),
      dificuldadesEncontradas: this.sanitizeString(data.dificuldadesEncontradas),
      sugestoesMelhoria: this.sanitizeString(data.sugestoesMelhoria),
      deviceInfo: data.deviceInfo || null,
      appVersion: data.appVersion || null,
    });

    await feedbackRepository.save(feedback);

    return feedback;
  }

  /**
   * Listar feedbacks com filtros
   */
  async listFeedbacks(filters: FeedbackFilters): Promise<Feedback[]> {
    const feedbackRepository = AppDataSource.getRepository(Feedback);

    const where: any = {};

    if (filters.vinculo) {
      where.vinculo = filters.vinculo;
    }

    if (filters.isAnonymous !== undefined) {
      where.isAnonymous = filters.isAnonymous;
    }

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const feedbacks = await feedbackRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return feedbacks;
  }

  /**
   * Obter feedback por ID
   */
  async getFeedbackById(id: number): Promise<Feedback | null> {
    const feedbackRepository = AppDataSource.getRepository(Feedback);

    const feedback = await feedbackRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    return feedback;
  }

  /**
   * Deletar feedback
   */
  async deleteFeedback(id: number): Promise<void> {
    const feedbackRepository = AppDataSource.getRepository(Feedback);

    const feedback = await feedbackRepository.findOne({ where: { id } });

    if (!feedback) {
      throw new Error('Feedback não encontrado');
    }

    await feedbackRepository.remove(feedback);
  }

  /**
   * Obter estatísticas dos feedbacks
   */
  async getStatistics(filters: { startDate?: string; endDate?: string }): Promise<FeedbackStatsDto> {
    const feedbackRepository = AppDataSource.getRepository(Feedback);

    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const feedbacks = await feedbackRepository.find({ where });

    const totalFeedbacks = feedbacks.length;

    // Contar por vínculo
    const byVinculo = {
      aluno: feedbacks.filter((f) => f.vinculo === 'aluno').length,
      visitante: feedbacks.filter((f) => f.vinculo === 'visitante').length,
      funcionario: feedbacks.filter((f) => f.vinculo === 'funcionario').length,
    };

    // Contar por anonimato
    const byAnonymous = {
      anonymous: feedbacks.filter((f) => f.isAnonymous).length,
      identified: feedbacks.filter((f) => !f.isAnonymous).length,
    };

    // Calcular médias
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => (arr.length > 0 ? sum(arr) / arr.length : 0);

    const averageScores = {
      identificarLocalizacao: avg(feedbacks.map((f) => f.identificarLocalizacao)),
      instrucoesClaras: avg(feedbacks.map((f) => f.instrucoesClaras)),
      representacaoFiel: avg(feedbacks.map((f) => f.representacaoFiel)),
      trajetoFacilSeguir: avg(feedbacks.map((f) => f.trajetoFacilSeguir)),
      facilUsar: avg(feedbacks.map((f) => f.facilUsar)),
      designClaro: avg(feedbacks.map((f) => f.designClaro)),
      interacaoSemDificuldade: avg(feedbacks.map((f) => f.interacaoSemDificuldade)),
      tempoRazoavel: avg(feedbacks.map((f) => f.tempoRazoavel)),
      confiancaDestino: avg(feedbacks.map((f) => f.confiancaDestino)),
      recomendaria: avg(feedbacks.map((f) => f.recomendaria)),
      voltariaUsar: avg(feedbacks.map((f) => f.voltariaUsar)),
      satisfacaoGeral: avg(feedbacks.map((f) => f.satisfacaoGeral)),
    };

    // Calcular NPS (Net Promoter Score) baseado em "recomendaria"
    const promoters = feedbacks.filter((f) => f.recomendaria >= 4).length;
    const detractors = feedbacks.filter((f) => f.recomendaria <= 2).length;
    const nps = totalFeedbacks > 0 ? ((promoters - detractors) / totalFeedbacks) * 100 : 0;

    return {
      totalFeedbacks,
      byVinculo,
      byAnonymous,
      averageScores,
      nps,
    };
  }

  /**
   * Exportar feedbacks para CSV
   */
  async exportToCsv(filters: { startDate?: string; endDate?: string }): Promise<string> {
    const feedbacks = await this.listFeedbacks(filters);

    const headers = [
      'ID',
      'Data',
      'Vínculo',
      'Anônimo',
      'Usuário',
      'Já Usou App',
      'Q3: Identificar Localização',
      'Q4: Instruções Claras',
      'Q5: Representação Fiel',
      'Q6: Trajeto Fácil',
      'Q7: Fácil Usar',
      'Q8: Design Claro',
      'Q9: Interação',
      'Q10: Tempo Razoável',
      'Q11: Confiança',
      'Q12: Recomendaria',
      'Q13: Voltaria a Usar',
      'Q14: Satisfação Geral',
      'O Que Agradou',
      'Dificuldades',
      'Sugestões',
      'Device',
      'Versão App',
    ];

    const rows = feedbacks.map((f) => [
      f.id,
      f.createdAt.toISOString(),
      f.vinculo,
      f.isAnonymous ? 'Sim' : 'Não',
      f.user ? f.user.name : 'Anônimo',
      f.jaUsouAppInterno ? 'Sim' : 'Não',
      f.identificarLocalizacao,
      f.instrucoesClaras,
      f.representacaoFiel,
      f.trajetoFacilSeguir,
      f.facilUsar,
      f.designClaro,
      f.interacaoSemDificuldade,
      f.tempoRazoavel,
      f.confiancaDestino,
      f.recomendaria,
      f.voltariaUsar,
      f.satisfacaoGeral,
      `"${f.oQueAgradou || ''}"`,
      `"${f.dificuldadesEncontradas || ''}"`,
      `"${f.sugestoesMelhoria || ''}"`,
      f.deviceInfo || '',
      f.appVersion || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return csv;
  }
}

export default new FeedbackService();
