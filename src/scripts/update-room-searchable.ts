import { AppDataSource } from '../config/data-source';
import { Room } from '../entities/Room';

/**
 * Script para atualizar rooms existentes marcando como não pesquisáveis
 * aqueles que são elementos estruturais (buracos, estruturas, vazios)
 * 
 * Execute: npx ts-node src/scripts/update-room-searchable.ts
 */

async function updateRoomSearchable() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexão com banco estabelecida\n');

        const roomRepo = AppDataSource.getRepository(Room);

        // Busca rooms que devem ser marcadas como não pesquisáveis
        const patterns = [
            '%buraco%',
            '%estrutura%', 
            '%vazio%',
            '%rampa%pátio%',
            'b2c estrutura',
            'dml%'
        ];

        let totalUpdated = 0;

        for (const pattern of patterns) {
            const rooms = await roomRepo
                .createQueryBuilder('room')
                .where('LOWER(room.name) LIKE :pattern', { pattern: pattern.toLowerCase() })
                .andWhere('room.isSearchable = :isSearchable', { isSearchable: true })
                .getMany();

            if (rooms.length > 0) {
            
                
                for (const room of rooms) {
                    room.isSearchable = false;
                    await roomRepo.save(room);
                    console.log(`   ❌ ${room.name} → isSearchable = false`);
                    totalUpdated++;
                }
            }
        }

        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log(`✅ Total de rooms atualizadas: ${totalUpdated}`);
        console.log('='.repeat(60));

        // Estatísticas
        const totalRooms = await roomRepo.count();
        const searchableRooms = await roomRepo.count({ where: { isSearchable: true } });
        const nonSearchableRooms = await roomRepo.count({ where: { isSearchable: false } });

        console.log('\n📊 ESTATÍSTICAS:');
        console.log(`   Total de rooms: ${totalRooms}`);
        console.log(`   Pesquisáveis: ${searchableRooms} (${((searchableRooms/totalRooms)*100).toFixed(1)}%)`);
        console.log(`   Não pesquisáveis: ${nonSearchableRooms} (${((nonSearchableRooms/totalRooms)*100).toFixed(1)}%)`);

        await AppDataSource.destroy();
        console.log('\n✅ Script finalizado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao executar script:', error);
        process.exit(1);
    }
}

// Executa o script
updateRoomSearchable();
