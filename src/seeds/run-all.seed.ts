import { execSync } from 'child_process';
import { join } from 'path';

async function runSeeders() {
    console.log("Iniciando execução dos seeders...");

    try {

        const seeders = [
            'course-locations.seed.ts',
            'exams.seed.ts',
         
        ];

        for (const seeder of seeders) {
            console.log(`\nExecutando ${seeder}...`);
            try {
                execSync(`ts-node "${join(__dirname, seeder)}"`, { stdio: 'inherit' });
                console.log(`✓ ${seeder} executado com sucesso!`);
            } catch (error) {
                console.error(`✗ Erro ao executar ${seeder}:`, error);
            }
        }

        console.log("\n✨ Todos os seeders foram executados!");

    } catch (error) {
        console.error("Erro ao executar seeders:", error);
        process.exit(1);
    }
}

runSeeders();
