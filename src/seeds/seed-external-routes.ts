  import { AppDataSource } from '../config/data-source';
  import { ExternalRoute } from '../entities/ExternalRoute';
  import * as fs from 'fs';
  import * as path from 'path';

  /**
   * Seed melhorado para rotas externas
   * Detecta automaticamente o modo (walking/driving) e evita duplicatas
   */
  async function seedExternalRoutes() {
    try {
      console.log('🌱 Iniciando seed de rotas externas...\n');
      
      await AppDataSource.initialize();
      const repo = AppDataSource.getRepository(ExternalRoute);

      type RouteMode = 'walking' | 'driving';
      const files: Array<{
        name: string;
        path: string;
        mode: RouteMode;
        floor?: number;
        inOut?: boolean;
        isDoor?: boolean;
      }> = [
       { 
          name: 'Rota-Externa-Carro', 
          path: '../mapeamentos/Rota-Externa-A-Carro/Rota-Externa-Carro.geojson',
          mode: 'driving',  // 🚗 Carro
        },
        { 
          name: 'Rota-Externa-1-Andar',
          path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-1-Andar.geojson',
          mode: 'walking',  // 🚶 A pé
          floor: 1
        },
        { 
          name: 'Rota-Externa-3-Andar', 
          path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-3-Andar.geojson',
          mode: 'walking',  // 🚶 A pé
          floor: 3
        },
        { 
          name: 'Rota-Externa-2-Andar', 
          path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-2-Andar.geojson',
          mode: 'walking',  // 🚶 A pé
          floor: 2
        },
        { 
          name: 'Rota-Externa-A-Pe', 
          path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-A-Pe.geojson',
          mode: 'walking',  // 🚶 A pé
          floor: 0
        },
      
      ];

      let totalSeeded = 0;
      let totalSkipped = 0;

      for (const file of files) {
        console.log(`📂 Processando: ${file.name}`);
        console.log(`   Modo: ${file.mode === 'driving' ? '🚗 Carro' : '🚶 A pé'}`);
        
        const filePath = path.join(__dirname, file.path);
        
        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
          console.warn(`   ⚠️  Arquivo não encontrado: ${filePath}`);
          console.log('');
          continue;
        }

        // Ler e parsear GeoJSON
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const geojson = JSON.parse(fileContent);

        if (!geojson.features || !Array.isArray(geojson.features)) {
          console.error(`   ❌ Formato GeoJSON inválido`);
          console.log('');
          continue;
        }

        console.log(`   Features encontradas: ${geojson.features.length}`);

        // Processar cada feature
        for (const feature of geojson.features) {
          try {
            // Gerar nome único para a rota
            const featureId = feature.properties?.id || 
                            feature.properties?.['felt:id'] || 
                            Math.random().toString(36).substring(7);
            
            const routeName = `${file.name}-${featureId}`;

            // Verificar se a rota já existe (evitar duplicatas)
            const existingRoute = await repo.findOne({
              where: { name: routeName }
            });

            if (existingRoute) {
              console.log(`   ⏭️  Rota já existe: ${routeName}`);
              totalSkipped++;
              continue;
            }

            // Preparar propriedades com o modo correto
            const properties = {
              ...feature.properties,
              mode: file.mode,  // ✅ ADICIONAR MODO AQUI
              isDoor: feature.properties?.isDoor || false,
              isStairs: feature.properties?.isStairs || false,
              isBathroom: feature.properties?.isBathroom || false,
              floor: feature.properties?.floor ?? 0,
              // Preservar propriedades originais do Felt
              originalFeltId: feature.properties?.['felt:id'],
              originalFeltType: feature.properties?.['felt:type'],
              originalRouteMode: feature.properties?.['felt:routeMode']
            };

            // Criar descrição automática
            const description = feature.properties?.['felt:routeMode'] || 
                              feature.properties?.routeMode || 
                              `Rota externa ${file.mode === 'driving' ? 'de carro' : 'a pé'}`;

            // Salvar rota
            const route = repo.create({
              name: routeName,
              description,
              geometry: feature.geometry,
              properties
            });

            await repo.save(route);
            totalSeeded++;
            
            console.log(`   ✅ Seeded: ${routeName}`);

          } catch (error: any) {
            console.error(`   ❌ Erro ao processar feature:`, error.message);
          }
        }

        console.log('');
      }

      // Estatísticas finais
      console.log('📊 RESUMO DO SEED:');
      console.log(`   Rotas criadas: ${totalSeeded}`);
      console.log(`   Rotas já existentes (puladas): ${totalSkipped}`);
      
      // Verificar contagem por modo
      const walkingCount = await repo.count({
        where: { 
          properties: { mode: 'walking' } as any 
        }
      });

      const drivingCount = await repo.count({
        where: { 
          properties: { mode: 'driving' } as any 
        }
      });

      console.log(`\n🚶 Total de rotas a pé: ${walkingCount}`);
      console.log(`🚗 Total de rotas de carro: ${drivingCount}`);
      console.log(`📍 Total geral: ${walkingCount + drivingCount}`);

      await AppDataSource.destroy();
      console.log('\n✅ Seed de rotas externas concluído com sucesso!');

    } catch (error: any) {
      console.error('❌ Erro durante o seed:', error);
      process.exit(1);
    }
  }

  seedExternalRoutes();