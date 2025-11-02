import { Request, Response } from 'express';
import UploadService from '../services/UploadService';

class UploadController {
  /**
   * Upload de planilha de horários
   */
  async uploadSchedule(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado.',
        });
      }

      const result = await UploadService.processScheduleFile(req.file);

      return res.status(200).json({
        success: true,
        message: 'Horários importados com sucesso.',
        data: result,
      });
    } catch (error: any) {
      console.error('[UploadController] Erro ao processar planilha de horários:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao processar arquivo de horários.',
        errors: error.errors || [],
      });
    }
  }

  /**
   * Upload de planilha de eventos
   */
  async uploadEvents(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado.',
        });
      }

      const result = await UploadService.processEventsFile(req.file);

      return res.status(200).json({
        success: true,
        message: 'Eventos importados com sucesso.',
        data: result,
      });
    } catch (error: any) {
      console.error('[UploadController] Erro ao processar planilha de eventos:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao processar arquivo de eventos.',
        errors: error.errors || [],
      });
    }
  }

  /**
   * Upload de planilha de calendário acadêmico
   */
  async uploadCalendar(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado.',
        });
      }

      const result = await UploadService.processCalendarFile(req.file);

      return res.status(200).json({
        success: true,
        message: 'Calendário acadêmico importado com sucesso.',
        data: result,
      });
    } catch (error: any) {
      console.error('[UploadController] Erro ao processar planilha de calendário:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao processar arquivo de calendário.',
        errors: error.errors || [],
      });
    }
  }

  /**
   * Upload de planilha de provas
   */
  async uploadExams(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado.',
        });
      }

      const result = await UploadService.processExamsFile(req.file);

      return res.status(200).json({
        success: true,
        message: 'Provas importadas com sucesso.',
        data: result,
      });
    } catch (error: any) {
      console.error('[UploadController] Erro ao processar planilha de provas:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Erro ao processar arquivo de provas.',
        errors: error.errors || [],
      });
    }
  }

  /**
   * Download de template de planilha
   */
  async downloadTemplate(req: Request, res: Response): Promise<Response | void> {
    try {
      const { type } = req.params;

      const validTypes = ['schedule', 'events', 'calendar', 'exams'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de template inválido.',
        });
      }

      const templatePath = await UploadService.getTemplatePath(type);
      
      return res.download(templatePath, `template_${type}.xlsx`, (err) => {
        if (err) {
          console.error('[UploadController] Erro ao fazer download do template:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro ao fazer download do template.',
          });
        }
      });
    } catch (error: any) {
      console.error('[UploadController] Erro ao buscar template:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar template.',
      });
    }
  }
}

export default new UploadController();
