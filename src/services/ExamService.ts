import { AppDataSource } from '../config/data-source';
import { Exam } from '../entities/Exam';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

class ExamService {
    private async processPdfFile(file: any): Promise<{ success: boolean, message?: string, exams?: any[] }> {
        return new Promise((resolve) => {
            try {
                // Caminho para o script Python
                const scriptPath = path.join(__dirname, '../scripts/parse_pdf_exams.py');
                
                // Verifica se o script existe
                if (!fs.existsSync(scriptPath)) {
                    resolve({ success: false, message: 'Script Python não encontrado.' });
                    return;
                }

                // Determina o caminho do Python (tenta usar o venv se existir)
                // Windows: venv/Scripts/python.exe
                // Linux/Mac: venv/bin/python
                const isWindows = process.platform === 'win32';
                const venvPython = isWindows 
                    ? path.join(__dirname, '../../venv/Scripts/python.exe')
                    : path.join(__dirname, '../../venv/bin/python');
                const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python';

                // Executa o script Python passando o PDF via stdin
                const pythonProcess = spawn(pythonCmd, [scriptPath], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let stdout = '';
                let stderr = '';

                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        // Tenta parsear como JSON de erro
                        try {
                            const errorData = JSON.parse(stderr);
                            if (errorData.error) {
                                resolve({ success: false, message: errorData.error });
                                return;
                            }
                        } catch {
                            // Se não for JSON, retorna o erro como está
                            resolve({ success: false, message: stderr || `Script Python retornou código ${code}` });
                            return;
                        }
                    }

                    try {
                        // Parse do resultado JSON
                        const result = JSON.parse(stdout);
                        
                        if (result.error) {
                            resolve({ success: false, message: result.error });
                            return;
                        }

                        resolve({ success: true, exams: result.exams || [] });
                    } catch (parseErr: any) {
                        resolve({ success: false, message: `Erro ao parsear resultado: ${parseErr.message}. Output: ${stdout.substring(0, 200)}` });
                    }
                });

                pythonProcess.on('error', (err) => {
                    resolve({ success: false, message: `Erro ao executar script Python: ${err.message}` });
                });

                // Envia o PDF para o stdin do processo Python
                pythonProcess.stdin.write(file.buffer);
                pythonProcess.stdin.end();

            } catch (err: any) {
                resolve({ success: false, message: `Erro ao processar PDF: ${err.message}` });
            }
        });
    }

    public async processTableFile(file: any): Promise<{ success: boolean, message?: string }> {
        const repo = AppDataSource.getRepository(Exam);
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        let rows: any[] = [];
        let exams: Exam[] = [];
        
        try {
            if (ext === 'pdf') {
                // Processa PDF usando script Python
                const pdfResult = await this.processPdfFile(file);
                if (!pdfResult.success) {
                    return { success: false, message: pdfResult.message };
                }
                
                // Converte os exames extraídos para a entidade Exam
                if (pdfResult.exams && pdfResult.exams.length > 0) {
                    exams = pdfResult.exams.map((examData: any) => {
                        return repo.create({
                            day: examData.day || '',
                            date: examData.date || '',
                            subject: examData.subject || '',
                            time: examData.time || '',
                            grade: examData.grade || null,
                            cycle: examData.cycle || 1,
                            shift: examData.shift || '',
                        });
                    });
                } else {
                    return { success: false, message: 'Nenhum exame encontrado no PDF.' };
                }
            } else if (ext === 'csv') {
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

            // Processa CSV/XLSX (código existente)
            if (ext !== 'pdf') {
                const header = rows[0].map((h: string) => h.trim().toLowerCase());
                const expected = ['day','date','subject','time','grade','cycle','shift'];
                if (header.length < expected.length || !expected.every((e, i) => header[i] === e)) {
                    return { success: false, message: 'Cabeçalho da tabela inválido.' };
                }
                
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
            }

            // Salva todos os exames
            if (exams.length > 0) {
                await repo.save(exams);
                return { success: true };
            } else {
                return { success: false, message: 'Nenhum exame encontrado para salvar.' };
            }
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
