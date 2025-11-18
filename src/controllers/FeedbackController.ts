import { Request, Response } from 'express';
import FeedbackService from '../services/FeedbackService';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

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

  /**
   * Exportar estatísticas de feedback para CSV usando script Python (apenas admin)
   */
  async exportStatsCsv(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      // Buscar estatísticas
      const stats = await FeedbackService.getStatistics({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      // Caminho para o script Python
      const scriptPath = join(__dirname, '../scripts/convert_csv.py');
      
      // Tentar usar Python do venv se existir, senão usar Python do sistema
      let pythonCommand: string;
      const venvPythonPath = process.platform === 'win32' 
        ? join(__dirname, '../scripts/venv/Scripts/python.exe')
        : join(__dirname, '../scripts/venv/bin/python3');
      
      if (existsSync(venvPythonPath)) {
        pythonCommand = venvPythonPath;
      } else {
        pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      }
      
      // Executar script Python passando JSON via stdin
      const pythonProcess = spawn(pythonCommand, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });

      let csvOutput = '';
      let errorOutput = '';

      // Enviar dados JSON para o script
      pythonProcess.stdin.write(JSON.stringify(stats));
      pythonProcess.stdin.end();

      // Coletar saída CSV
      pythonProcess.stdout.on('data', (data) => {
        csvOutput += data.toString();
      });

      // Coletar erros
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Script Python falhou com código ${code}: ${errorOutput}`));
          } else {
            resolve();
          }
        });
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback_stats.csv');

      return res.status(200).send(csvOutput);
    } catch (error: any) {
      return res.status(500).json({
        message: error.message || 'Erro ao exportar estatísticas',
      });
    }
  }
}

export default new FeedbackController();
