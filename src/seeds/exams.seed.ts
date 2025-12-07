import { AppDataSource } from '../config/data-source';
import { Exam } from '../entities/Exam';

async function run() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(Exam);

        const exams = [
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14275 - Arquitetura e Organização de Computadores', time: '19:00 - 20:00', grade: '1º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14281 - Inovação em Tecnologia da Informação', time: '19:00 - 20:00', grade: '2º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '11294 - Qualidade de Software', time: '19:00 - 20:00', grade: '6º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14278 - Matemática Computacional', time: '20:15 - 21:15', grade: '2º / 3º / 6º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14284 - Redes de Computadores', time: '21:30 - 22:30', grade: '3º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '11300 - Internet das Coisas', time: '21:30 - 22:30', grade: '8º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14291 - Programação Orientada a Objetos', time: '21:30 - 22:30', grade: '4º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14271 - Engenharia de Software', time: '21:30 - 22:30', grade: '1º', cycle: 1, shift: 'noturno' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '111471 - Governança de Tecnologia da Informação', time: '21:30 - 22:30', grade: '5º', cycle: 1, shift: 'noturno' },

            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '111473 - Processamento Digital', time: '19:00 - 20:00', grade: '6º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11302 - Segurança da Informação', time: '19:00 - 20:00', grade: '8º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '14280 - Algoritmos e Programação', time: '19:00 - 20:00', grade: '2º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '14285 - Laboratório de Programação', time: '20:15 - 21:15', grade: '3º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '14289 - Estrutura de Dados', time: '20:15 - 21:15', grade: '4º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '14274 - Limite e Derivada de Uma Variável', time: '20:15 - 21:15', grade: '1º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11287 - Árvores e Grafos', time: '20:15 - 21:15', grade: '5º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11476 - Data Science', time: '20:15 - 21:15', grade: '8º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '14273 - Requisitos e Métricas de Software', time: '21:30 - 22:30', grade: '1º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11147 - Arquitetura de Software', time: '21:30 - 22:30', grade: '6º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11288 - Sistemas Gerenciadores de Banco de Dados', time: '21:30 - 22:30', grade: '5º / 4º', cycle: 1, shift: 'noturno' },

            // --- QUARTA-FEIRA (29/10/2025) - NOTURNO ---
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14283 - Probabilidade e Estatística', time: '19:00 - 20:00', grade: '4º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14279 - Sistemas Operacionais', time: '19:00 - 20:00', grade: '2º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14282 - Gestão Ágil de Projetos', time: '19:00 - 20:00', grade: '3º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14276 - Design de Interface e Experiência de Usuário', time: '20:15 - 21:15', grade: '2º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '11303 - Desenvolvimento Mobile', time: '20:15 - 21:15', grade: '8º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14286 - Projeto de Banco de Dados', time: '20:15 - 21:15', grade: '3º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '11296 - Desenvolvimento de API Back-End', time: '21:30 - 22:30', grade: '6º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '11290 - Desenvolvimento Web Front-End', time: '21:30 - 22:30', grade: '5º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14312 - Cidadania, Ética e Espiritualidade', time: '21:30 - 22:30', grade: '1º', cycle: 1, shift: 'noturno' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14288 - Sistemas Distribuídos', time: '21:30 - 22:30', grade: '4º', cycle: 1, shift: 'noturno' },

            // --- TERÇA-FEIRA (04/11/2025) - NOTURNO ---
            { day: 'TERÇA-FEIRA', date: '04/11/2025', subject: '111475 - Fábrica de Software', time: '19:00 - 22:40', grade: '7º', cycle: 1, shift: 'noturno' },
            { day: 'TERÇA-FEIRA', date: '04/11/2025', subject: '111477 - Habilidades Complementares em Engenharia de Software', time: '19:00 - 22:40', grade: '8º', cycle: 1, shift: 'noturno' },

            // --- MATUTINO (27/10/2025) ---
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14279 - Sistemas Operacionais', time: '08:00 - 09:00', grade: '3º', cycle: 2, shift: 'matutino' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14290 - Sistemas Gerenciadores de Banco de Dados', time: '08:00 - 09:00', grade: '4º / 5º', cycle: 2, shift: 'matutino' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '111473 - Processamento Digital', time: '08:00 - 09:00', grade: '6º', cycle: 2, shift: 'matutino' },
            { day: 'SEGUNDA-FEIRA', date: '27/10/2025', subject: '14288 - Sistemas Distribuídos', time: '09:15 - 10:15', grade: '3º / 4º', cycle: 2, shift: 'matutino' },

            // --- MATUTINO (28/10/2025) ---
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11294 - Qualidade de Software', time: '08:00 - 09:00', grade: '6º', cycle: 2, shift: 'matutino' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '14283 - Probabilidade e Estatística', time: '08:00 - 09:00', grade: '3º / 4º', cycle: 2, shift: 'matutino' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11287 - Árvores e Grafos', time: '08:00 - 09:00', grade: '5º', cycle: 2, shift: 'matutino' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '11296 - Desenvolvimento de API Back-End', time: '09:15 - 10:15', grade: '6º', cycle: 2, shift: 'matutino' },
            { day: 'TERÇA-FEIRA', date: '28/10/2025', subject: '14286 - Projeto de Banco de Dados', time: '09:15 - 10:15', grade: '3º', cycle: 2, shift: 'matutino' },

            // --- MATUTINO (29/10/2025) ---
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14289 - Estruturas de Dados', time: '08:00 - 09:00', grade: '3º / 4º', cycle: 2, shift: 'matutino' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '11472 - Matemática Computacional', time: '08:00 - 09:00', grade: '5º / 6º', cycle: 2, shift: 'matutino' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '14291 - Programação Orientada a Objetos', time: '09:15 - 10:15', grade: '4º', cycle: 2, shift: 'matutino' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '11290 - Desenvolvimento Web Front-End', time: '09:15 - 10:15', grade: '5º', cycle: 2, shift: 'matutino' },
            { day: 'QUARTA-FEIRA', date: '29/10/2025', subject: '111474 - Arquitetura de Software', time: '09:15 - 10:15', grade: '6º', cycle: 2, shift: 'matutino' },
        ];

        for (const ex of exams) {
            const e = repo.create(ex);
            await repo.save(e);
        }

        console.log('✅ Exams seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding exams:', error);
        process.exit(1);
    }
}

run();
