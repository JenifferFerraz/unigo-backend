import { Request, Response } from 'express';
import AcademicCalendarService from '../services/AcademicCalendarService';

class AcademicCalendarController {
    /**
     * Atualizar evento do calendário
     */
    public static async update(req: Request, res: Response): Promise<Response> {
      try {
        const id = parseInt(req.params.id, 10);
        const updateData = req.body;
        const updatedEvent = await AcademicCalendarService.update(id, updateData);
        if (!updatedEvent) {
          return res.status(404).json({ message: 'Evento do calendário não encontrado.' });
        }
        return res.status(200).json({ success: true, data: updatedEvent });
      } catch (error: any) {
        console.error('[AcademicCalendarController] Erro ao atualizar evento do calendário:', error);
        return res.status(400).json({ success: false, message: error.message });
      }
    }
  /**
   * Listar todos os eventos do calendário com filtros opcionais
   */
  public static async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const type = req.query.type as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const course = req.query.course as string | undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string, 10) : undefined;

      const calendar = await AcademicCalendarService.findAll({ type, isActive, semester, year, month, course, courseId });
      return res.status(200).json(calendar);
    } catch (error: any) {
      console.error('[AcademicCalendarController] Erro ao buscar calendário:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Buscar evento do calendário por ID
   */
  public static async findById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const calendarEvent = await AcademicCalendarService.findById(id);

      if (!calendarEvent) {
        return res.status(404).json({ message: 'Evento do calendário não encontrado.' });
      }

      return res.status(200).json(calendarEvent);
    } catch (error: any) {
      console.error('[AcademicCalendarController] Erro ao buscar evento do calendário:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Deletar evento do calendário
   */
  public static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      await AcademicCalendarService.delete(id);
      return res.status(200).json({ message: 'Evento do calendário deletado com sucesso.' });
    } catch (error: any) {
      console.error('[AcademicCalendarController] Erro ao deletar evento do calendário:', error);
      return res.status(500).json({ message: error.message });
    }
  }
}

export default AcademicCalendarController;
