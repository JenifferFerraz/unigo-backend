import { AppDataSource } from "../config/data-source";
import { Location } from "../entities/Location";

// Script para verificar os dados inseridos
async function checkLocations() {
    try {
        await AppDataSource.initialize();
        console.log("Conexão com o banco de dados estabelecida");
        
        const locationRepository = AppDataSource.getRepository(Location);
        
        // Total de localizações
        const count = await locationRepository.count();
        console.log(`Total de localizações cadastradas: ${count}`);
        
        // Localizações por tipo
        const byType = await locationRepository
            .createQueryBuilder('location')
            .select('location.type, COUNT(*) as count')
            .groupBy('location.type')
            .getRawMany();
            
        console.log('Localizações por tipo:');
        console.table(byType);
        
        // Localizações por bloco
        const byBlock = await locationRepository
            .createQueryBuilder('location')
            .select('location.block, COUNT(*) as count')
            .where('location.block IS NOT NULL')
            .groupBy('location.block')
            .getRawMany();
            
        console.log('Localizações por bloco:');
        console.table(byBlock);
        
    } catch (error) {
        console.error("Erro ao verificar localizações:", error);
    } finally {
        await AppDataSource.destroy();
        console.log("Conexão com o banco de dados fechada");
    }
}

// Executar o script
checkLocations();
