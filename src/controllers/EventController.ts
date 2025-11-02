import { Request, Response } from 'express';
import EventService from '../services/EventService';

class EventController {
  /**
   * Listar todos os eventos com filtros opcionais
   */
  public static async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const type = req.query.type as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const events = await EventService.findAll({ type, isActive, startDate, endDate });
      return res.status(200).json(events);
    } catch (error: any) {
      console.error('[EventController] Erro ao buscar eventos:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Buscar evento por ID
   */
  public static async findById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const event = await EventService.findById(id);

      if (!event) {
        return res.status(404).json({ message: 'Evento não encontrado.' });
      }

      return res.status(200).json(event);
    } catch (error: any) {
      console.error('[EventController] Erro ao buscar evento:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Deletar evento
   */
  public static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      await EventService.delete(id);
      return res.status(200).json({ message: 'Evento deletado com sucesso.' });
    } catch (error: any) {
      console.error('[EventController] Erro ao deletar evento:', error);
      return res.status(500).json({ message: error.message });
    }
  }
}

export default EventController;
