import { Request, Response } from 'express';
import ExamService from '../services/ExamService';


import { Exam } from '../entities/Exam';
import { AppDataSource } from '../config/data-source';

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
            const courseIdQuery = req.query.courseId as string | undefined;
            const courseId = courseIdQuery ? parseInt(courseIdQuery, 10) : undefined;
            const exams = await ExamService.findAll(cycle, shift, month, year, courseId);
            return res.status(200).json(exams);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    public static async update(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const examRepository = AppDataSource.getRepository(Exam);

            const exam = await examRepository.findOneBy({ id: Number(id) });
            if (!exam) {
                return res.status(404).json({ success: false, message: 'Prova não encontrada.' });
            }

            examRepository.merge(exam, updateData);
            const updatedExam = await examRepository.save(exam);

            return res.status(200).json({ success: true, data: updatedExam });
        } catch (error: any) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    public static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const examRepository = AppDataSource.getRepository(Exam);

            const exam = await examRepository.findOneBy({ id: Number(id) });
            if (!exam) {
                return res.status(404).json({ success: false, message: 'Prova não encontrada.' });
            }

            await examRepository.remove(exam);

            return res.status(200).json({ success: true, message: 'Prova deletada com sucesso.' });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default ExamController;
