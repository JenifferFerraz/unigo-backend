import { Request, Response } from 'express';
import ExamService from '../services/ExamService';

class ExamController {
    public static async uploadTable(req: Request, res: Response): Promise<Response> {
        try {
            const file = (req as any).file;
            if (!file) {
                return res.status(400).json({ message: 'Arquivo não enviado.' });
            }
            const result = await ExamService.processTableFile(file);
            if (result.success) {
                return res.status(200).json({ message: 'Tabela processada e exames salvos com sucesso.' });
            } else {
                return res.status(400).json({ message: result.message });
            }
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
    public static async findAll(req: Request, res: Response): Promise<Response> {
        try {
            const cycleQuery = req.query.cycle as string | undefined;
            const cycle = cycleQuery ? parseInt(cycleQuery, 10) : undefined;
            const shift = (req.query.shift as string | undefined) ?? undefined;
            const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
            const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
            const exams = await ExamService.findAll(cycle, shift, month, year);
            return res.status(200).json(exams);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default ExamController;
