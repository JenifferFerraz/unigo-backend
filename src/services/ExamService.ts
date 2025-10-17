import { AppDataSource } from '../config/data-source';
import { Exam } from '../entities/Exam';

class ExamService {
    public async processTableFile(file: any): Promise<{ success: boolean, message?: string }> {
        const repo = AppDataSource.getRepository(Exam);
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        let rows: any[] = [];
        try {
            if (ext === 'csv') {
                const content = file.buffer.toString('utf8');
                rows = content.split('\n').map(l => l.split(';'));
            } else if (ext === 'xlsx') {
                const xlsx = require('xlsx');
                const workbook = xlsx.read(file.buffer, { type: 'buffer' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            } else {
                return { success: false, message: 'Formato de arquivo não suportado.' };
            }
            const header = rows[0].map((h: string) => h.trim().toLowerCase());
            const expected = ['day','date','subject','time','grade','cycle','shift'];
            if (header.length < expected.length || !expected.every((e, i) => header[i] === e)) {
                return { success: false, message: 'Cabeçalho da tabela inválido.' };
            }
            const exams: Exam[] = [];
            for (let i = 1; i < rows.length; i++) {
                const r = rows[i];
                if (r.length < expected.length) continue;
                const exam = repo.create({
                    day: r[0],
                    date: r[1],
                    subject: r[2],
                    time: r[3],
                    grade: r[4],
                    cycle: parseInt(r[5], 10),
                    shift: r[6],
                });
                exams.push(exam);
            }
            // Salva todos
            await repo.save(exams);
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.message };
        }
    }
    public async findAll(cycle?: number, shift?: string, month?: number, year?: number): Promise<Exam[]> {
        const repo = AppDataSource.getRepository(Exam);
        let exams = await repo.find();
        if (typeof cycle === 'number') {
            exams = exams.filter(e => e.cycle === cycle);
        }
        if (shift) {
            exams = exams.filter(e => e.shift === shift);
        }
        if (month && year) {
            exams = exams.filter(e => {
                if (!e.date) return false;
                // espera formato dd/MM/yyyy
                const parts = e.date.split('/');
                if (parts.length < 3) return false;
                const examMonth = parseInt(parts[1], 10);
                const examYear = parseInt(parts[2], 10);
                return examMonth === month && examYear === year;
            });
        }
        return exams;
    }
}

export default new ExamService();
