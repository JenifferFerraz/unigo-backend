import { Request, Response } from 'express';
import ExamService from '../services/ExamService';

class ExamController {
    public static async findAll(req: Request, res: Response): Promise<Response> {
        try {
            const cycleQuery = req.query.cycle as string | undefined;
            const cycle = cycleQuery ? parseInt(cycleQuery, 10) : undefined;
            const shift = (req.query.shift as string | undefined) ?? undefined;
            const exams = await ExamService.findAll(cycle, shift);
            return res.status(200).json(exams);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default ExamController;
