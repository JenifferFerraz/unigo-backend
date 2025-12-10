import { Request, Response } from 'express';
import ScheduleService from '../services/ScheduleService';

class ScheduleController {
  /**
   * Listar todos os horários com filtros opcionais
   */
  public static async findAll(req: Request, res: Response): Promise<Response> {
    try {
      const course = req.query.course as string | undefined;
      const shift = req.query.shift as string | undefined;
      const dayOfWeek = req.query.dayOfWeek as string | undefined;
      const semester = req.query.semester ? parseInt(req.query.semester as string, 10) : undefined;
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string, 10) : undefined;

      const { schedules, periods } = await ScheduleService.findAllWithPeriods({ course, shift, dayOfWeek, semester, courseId });
      return res.status(200).json({ schedules, periods });
    } catch (error: any) {
      console.error('[ScheduleController] Erro ao buscar horários:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Buscar horário por ID
   */
  public static async findById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const schedule = await ScheduleService.findById(id);

      if (!schedule) {
        return res.status(404).json({ message: 'Horário não encontrado.' });
      }

      return res.status(200).json(schedule);
    } catch (error: any) {
      console.error('[ScheduleController] Erro ao buscar horário:', error);
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Atualizar horário
   */
  public static async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const updateData = req.body;
      const updatedSchedule = await ScheduleService.update(id, updateData);
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: 'Horário não encontrado.' });
      }
      
      return res.status(200).json({ success: true, data: updatedSchedule });
    } catch (error: any) {
      console.error('[ScheduleController] Erro ao atualizar horário:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Deletar horário
   */
  public static async delete(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      await ScheduleService.delete(id);
      return res.status(200).json({ message: 'Horário deletado com sucesso.' });
    } catch (error: any) {
      console.error('[ScheduleController] Erro ao deletar horário:', error);
      return res.status(500).json({ message: error.message });
    }
  }
}

export default ScheduleController;
