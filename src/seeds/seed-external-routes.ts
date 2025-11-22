import { AppDataSource } from '../config/data-source';
import { ExternalRoute } from '../entities/ExternalRoute';
import * as fs from 'fs';
import * as path from 'path';

async function seedExternalRoutesWithPassarelas() {
  try {
    console.log('🌱 Iniciando seed de rotas externas (incluindo passarelas)...\n');
    
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(ExternalRoute);

    type RouteMode = 'walking' | 'driving';
    
    const files: Array<{
      name: string;
      path: string;
      mode: RouteMode;
      floor: number;
      isPassarela?: boolean;
    }> = [
      // 🚶 ROTAS A PÉ POR ANDAR
      { 
        name: 'Rota-Externa-A-Pe-Terreo',
        path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-A-Pe.geojson',
        mode: 'walking',
        floor: 0
      },
      { 
        name: 'Rota-Externa-A-Pe-1-Andar',
        path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-1-Andar.geojson',
        mode: 'walking',
        floor: 1
      },
      { 
        name: 'Rota-Externa-A-Pe-2-Andar',
        path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-2-Andar.geojson',
        mode: 'walking',
        floor: 2
      },
      { 
        name: 'Rota-Externa-A-Pe-3-Andar',
        path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-3-Andar.geojson',
        mode: 'walking',
        floor: 3
      },
      
      // 🚗 ROTA DE CARRO
      { 
        name: 'Rota-Externa-Carro',
        path: '../mapeamentos/Rota-Externa-A-Carro/Rota-Externa-Carro.geojson',
        mode: 'driving',
        floor: 0
      },
      
      // 🌉 PASSARELAS (ROTAS EXTERNAS ESPECIAIS)
      { 
        name: 'Passarelas',
        path: '../mapeamentos/Extras/rota-passarelas.geojson',
        mode: 'walking',
        floor: 0, // será substituído por fromFloor/toFloor
        isPassarela: true
      }
    ];

    let totalSeeded = 0;
    let totalSkipped = 0;

    for (const file of files) {
      console.log(`\n📂 Processando: ${file.name}`);
      console.log(`   Tipo: ${file.isPassarela ? '🌉 Passarela' : (file.mode === 'driving' ? '🚗 Carro' : '🚶 A pé')}`);
      
      const filePath = path.join(__dirname, file.path);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`   ⚠️  Arquivo não encontrado: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(fileContent);

      if (!geojson.features || !Array.isArray(geojson.features)) {
        console.error(`   ❌ Formato GeoJSON inválido`);
        continue;
      }

      console.log(`   Features encontradas: ${geojson.features.length}`);

      for (const feature of geojson.features) {
        try {
          const featureId = feature.properties?.id || 
                          feature.properties?.['felt:id'] || 
                          Math.random().toString(36).substring(7);

          // 🌉 TRATAMENTO ESPECIAL PARA PASSARELAS
          if (file.isPassarela) {
            const fromFloor = feature.properties?.fromFloor;
            const toFloor = feature.properties?.toFloor;
            
            // Arredondar floors
            const fromFloorInt = typeof fromFloor === 'number' ? Math.round(fromFloor) : null;
            const toFloorInt = typeof toFloor === 'number' ? Math.round(toFloor) : null;

            if (fromFloorInt === null || toFloorInt === null) {
              console.warn(`   ⚠️  Passarela ${featureId}: fromFloor/toFloor inválido`);
              totalSkipped++;
              continue;
            }

            const description = feature.properties?.description || '';
            console.log(`\n   🌉 Passarela ID ${featureId}: ${description}`);
            console.log(`      Conecta: Andar ${fromFloorInt} → Andar ${toFloorInt}`);

            // 🔥 CRIAR PASSARELA COMO ROTA EXTERNA
            const existingRoute = await repo
              .createQueryBuilder('route')
              .where("route.properties->>'id' = :id", { id: String(featureId) })
              .andWhere("route.properties->>'isPassarela' = :isPassarela", { isPassarela: 'true' })
              .getOne();

            if (existingRoute) {
              console.log(`      ⏭️  Já existe`);
              totalSkipped++;
              continue;
            }

            // Determinar tipo
            let routeType = 'level_passage';
            let isRamp = false;
            
            if (feature.properties?.isRamp === true || description.includes('Rampa')) {
              routeType = 'ramp';
              isRamp = true;
            }

            const properties = {
              id: String(featureId),
              mode: 'walking', // Passarelas sempre a pé
              isPassarela: true, // 🔥 FLAG IMPORTANTE
              type: routeType,
              isConnection: true,
              isLevelPassage: !isRamp,
              isRamp: isRamp,
              isDoor: feature.properties?.isDoor || false,
              fromFloor: fromFloorInt,
              toFloor: toFloorInt,
              originalFromFloor: fromFloor,
              originalToFloor: toFloor,
              connectsFrom: feature.properties?.connectsFrom,
              connectsTo: feature.properties?.connectsTo,
              description: description,
              ...feature.properties
            };

            const routeName = `Passarela-${featureId}`;
            const routeDescription = `${description} (Andar ${fromFloorInt} → ${toFloorInt})`;

            const route = repo.create({
              name: routeName,
              description: routeDescription,
              geometry: feature.geometry,
              properties
            });

            await repo.save(route);
            totalSeeded++;
            
            const emoji = isRamp ? '🛤️' : '🌉';
            console.log(`      ${emoji} Criada com sucesso!`);

          } else {
            // 🚶/🚗 ROTAS NORMAIS (A PÉ OU CARRO)
            
            const existingRoute = await repo
              .createQueryBuilder('route')
              .where("route.properties->>'id' = :id", { id: String(featureId) })
              .andWhere("route.properties->>'floor' = :floor", { floor: String(file.floor) })
              .getOne();

            if (existingRoute) {
              totalSkipped++;
              continue;
            }

            const properties = {
              id: String(featureId),
              mode: file.mode,
              floor: file.floor,
              isPassarela: false,
              isDoor: feature.properties?.isDoor || false,
              isStairs: feature.properties?.isStairs || false,
              isBathroom: feature.properties?.isBathroom || false,
              'In/Out': feature.properties?.['In/Out'] || false,
              ...feature.properties
            };

            const routeName = `${file.name}-${featureId}`;
            const routeDescription = `Rota externa ${file.mode === 'driving' ? 'de carro' : 'a pé'} - Andar ${file.floor}`;

            const route = repo.create({
              name: routeName,
              description: routeDescription,
              geometry: feature.geometry,
              properties
            });

            await repo.save(route);
            totalSeeded++;
          }

        } catch (error: any) {
          console.error(`   ❌ Erro:`, error.message);
        }
      }
    }

    // 📊 ESTATÍSTICAS FINAIS
    console.log('\n\n📊 RESUMO DO SEED:');
    console.log(`   ✅ Rotas criadas: ${totalSeeded}`);
    console.log(`   ⏭️  Rotas já existentes: ${totalSkipped}`);
    
    const walkingCount = await repo
      .createQueryBuilder('route')
      .where("route.properties->>'mode' = :mode", { mode: 'walking' })
      .andWhere("(route.properties->>'isPassarela')::boolean IS NOT TRUE")
      .getCount();

    const drivingCount = await repo
      .createQueryBuilder('route')
      .where("route.properties->>'mode' = :mode", { mode: 'driving' })
      .getCount();

    const passarelasCount = await repo
      .createQueryBuilder('route')
      .where("(route.properties->>'isPassarela')::boolean = TRUE")
      .getCount();

    console.log(`\n🚶 Rotas a pé: ${walkingCount}`);
    console.log(`🚗 Rotas de carro: ${drivingCount}`);
    console.log(`🌉 Passarelas: ${passarelasCount}`);
    console.log(`📍 Total geral: ${walkingCount + drivingCount + passarelasCount}`);

    // Contagem por andar (rotas normais)
    console.log(`\n📍 Rotas por andar:`);
    for (let floor = 0; floor <= 3; floor++) {
      const count = await repo
        .createQueryBuilder('route')
        .where("route.properties->>'floor' = :floor", { floor: String(floor) })
        .andWhere("(route.properties->>'isPassarela')::boolean IS NOT TRUE")
        .getCount();
      console.log(`   Andar ${floor}: ${count} rotas`);
    }

    await AppDataSource.destroy();
    console.log('\n✅ Seed de rotas externas concluído com sucesso!');

  } catch (error: any) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

seedExternalRoutesWithPassarelas();