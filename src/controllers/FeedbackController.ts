import { Request, Response } from 'express';
import FeedbackService from '../services/FeedbackService';

class FeedbackController {
  /**
   * Criar feedback (anônimo ou autenticado)
   */
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || null; 
      const isAnonymous = userId === null;
      
      const feedbackData = {
        ...req.body,
        userId,
        isAnonymous,
      };

      const feedback = await FeedbackService.createFeedback(feedbackData);

      return res.status(201).json({
        message: 'Feedback enviado com sucesso! Obrigado pela sua contribuição.',
        feedback,
      });
    } catch (error: any) {
      return res.status(400).json({
        message: error.message || 'Erro ao enviar feedback',
      });
    }
  }

  /**
   * Listar todos os feedbacks (apenas admin)
   */
  async list(req: Request, res: Response) {
    try {
      const { vinculo, isAnonymous, startDate, endDate } = req.query;

      const filters = {
        vinculo: vinculo as string | undefined,
        isAnonymous: isAnonymous === 'true' ? true : isAnonymous === 'false' ? false : undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      };

      const feedbacks = await FeedbackService.listFeedbacks(filters);

      return res.status(200).json(feedbacks);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || 'Erro ao listar feedbacks',
      });
    }
  }

  /**
   * Obter estatísticas dos feedbacks (apenas admin)
   */
  async getStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await FeedbackService.getStatistics({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      return res.status(200).json(stats);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || 'Erro ao obter estatísticas',
      });
    }
  }

  /**
   * Obter feedback por ID (apenas admin)
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const feedback = await FeedbackService.getFeedbackById(Number(id));

      if (!feedback) {
        return res.status(404).json({
          message: 'Feedback não encontrado',
        });
      }

      return res.status(200).json(feedback);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || 'Erro ao buscar feedback',
      });
    }
  }

  /**
   * Deletar feedback (apenas admin)
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await FeedbackService.deleteFeedback(Number(id));

      return res.status(200).json({
        message: 'Feedback deletado com sucesso',
      });
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || 'Erro ao deletar feedback',
      });
    }
  }

  /**
   * Exportar feedbacks para CSV (apenas admin)
   */
  async exportCsv(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const csv = await FeedbackService.exportToCsv({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=feedbacks.csv');

      return res.status(200).send(csv);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || 'Erro ao exportar feedbacks',
      });
    }
  }
}

export default new FeedbackController();
