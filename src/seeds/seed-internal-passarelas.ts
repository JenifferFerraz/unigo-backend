import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { Structure } from '../entities/Structure';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🔥 SEED SIMPLIFICADO: Mapeamento manual de passarelas para estruturas
 */

// 🎯 MAPA: Qual passarela conecta quais estruturas
const PASSARELA_ESTRUTURAS: { [key: string]: string[] } = {
  // Passarela Alta: Bloco A → Blocos B (B1, B2, B2C)
  '10': ['BLOCO A', 'BLOCO B1', 'BLOCO B2', 'B2C ESTRUTURA'],
  '11': ['BLOCO A', 'BLOCO B1', 'BLOCO B2', 'B2C ESTRUTURA'],
  '12': ['BLOCO A', 'BLOCO B1', 'BLOCO B2', 'B2C ESTRUTURA'],
  '13': ['BLOCO B1', 'BLOCO B2', 'B2C ESTRUTURA'],
  '14': ['BLOCO B1', 'BLOCO B2', 'B2C ESTRUTURA'],
  '15': ['BLOCO B1', 'BLOCO B2', 'B2C ESTRUTURA'],
  '16': ['BLOCO B1'],
  '17': ['BLOCO B1'],
  '18': ['BLOCO B1'],
  '19': ['BLOCO B1', 'BLOCO B2', 'B2C ESTRUTURA'],
  
  // Rota Coberta: Bloco A → Bloco E
  '20': ['BLOCO A', 'E ESTRUTURA'],
  '21': ['BLOCO A', 'E ESTRUTURA'],
  
  // Rampas Bloco A
  '1': ['BLOCO A'], // Rampa Térreo → Andar 0
  '2': ['BLOCO A'], // Rampa Térreo → Andar 1
};

async function seedInternalRoutesWithPassarelas() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(InternalRoute);
  const structureRepo = AppDataSource.getRepository(Structure);

  const passarelasPath = path.join(__dirname, '../mapeamentos/Extras/rota-passarelas.geojson');
  
  if (!fs.existsSync(passarelasPath)) {
    console.error(`❌ Arquivo não encontrado: ${passarelasPath}`);
    await AppDataSource.destroy();
    return;
  }

  const passarelasGeojson = JSON.parse(fs.readFileSync(passarelasPath, 'utf8'));

  // Carregar todas estruturas e criar índice por nome
  const allStructures = await structureRepo.find();
  const structureByName = new Map<string, any>();
  
  for (const struct of allStructures) {
    structureByName.set(struct.name, struct);
  }

  console.log(`\n📦 Estruturas disponíveis:`);
  for (const struct of allStructures) {
    console.log(`   ${struct.id} - ${struct.name}`);
  }

  let totalSeeded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  console.log(`\n🌉 Processando ${passarelasGeojson.features.length} features...\n`);

  for (const feature of passarelasGeojson.features) {
    const featureId = String(feature.properties?.id);
    const fromFloor = feature.properties?.fromFloor;
    const toFloor = feature.properties?.toFloor;
    const description = feature.properties?.description || '';

    console.log(`\n📂 Feature ID ${featureId}: ${description}`);

    // 🔥 CORREÇÃO: Converter floors para inteiros
    let fromFloorInt = typeof fromFloor === 'number' ? Math.round(fromFloor) : null;
    let toFloorInt = typeof toFloor === 'number' ? Math.round(toFloor) : null;

    // Validação básica
    if (fromFloorInt === null || toFloorInt === null) {
      console.warn(`   ⚠️  Pulada: fromFloor ou toFloor inválido`);
      totalSkipped++;
      continue;
    }

    if (fromFloorInt === toFloorInt) {
      console.warn(`   ⚠️  Pulada: mesmo andar (${fromFloorInt})`);
      totalSkipped++;
      continue;
    }

    // Log de conversão se houve arredondamento
    if (fromFloor !== fromFloorInt || toFloor !== toFloorInt) {
      console.log(`   📐 Arredondamento: ${fromFloor}→${fromFloorInt}, ${toFloor}→${toFloorInt}`);
    }

    // 🔥 BUSCAR ESTRUTURAS NO MAPA
    const structureNames = PASSARELA_ESTRUTURAS[featureId];
    
    if (!structureNames || structureNames.length === 0) {
      console.warn(`   ⚠️  Feature ${featureId} não mapeada - pulando`);
      totalSkipped++;
      continue;
    }

    console.log(`   🏢 Estruturas mapeadas: ${structureNames.join(', ')}`);

    // Processar cada estrutura
    for (const structureName of structureNames) {
      const structure = structureByName.get(structureName);
      
      if (!structure) {
        console.error(`   ❌ Estrutura "${structureName}" não encontrada no banco!`);
        totalErrors++;
        continue;
      }

      // 🔥 CRIAR ENTRADA PARA CADA ANDAR (usando inteiros)
      const floors = [fromFloorInt, toFloorInt];

      for (const currentFloor of floors) {
        const routeName = `passarela-${featureId}-${structure.name}-floor-${currentFloor}`;

        // Verificar duplicata
        const existing = await repo.findOne({
          where: {
            structure: { id: structure.id },
            floor: currentFloor,
            properties: { id: featureId } as any
          }
        });

        if (existing) {
          console.log(`      ⏭️  ${structure.name} andar ${currentFloor}: já existe`);
          totalSkipped++;
          continue;
        }

        // Criar propriedades (mantém valores originais nos metadados)
        const properties = {
          id: featureId,
          type: 'level_passage',
          isConnection: true,
          isLevelPassage: true,
          fromFloor: fromFloorInt,      // ✅ Valor arredondado
          toFloor: toFloorInt,           // ✅ Valor arredondado
          originalFromFloor: fromFloor,  // 📝 Preserva valor original
          originalToFloor: toFloor,      // 📝 Preserva valor original
          connectsFrom: feature.properties?.connectsFrom,
          connectsTo: feature.properties?.connectsTo,
          description: description,
          ...feature.properties
        };

        // Salvar no banco
        const route = repo.create({
          structure: structure,
          floor: currentFloor,
          geometry: feature.geometry,
          properties
        });

        await repo.save(route);
        totalSeeded++;
        
        console.log(`      ✅ ${structure.name} andar ${currentFloor}: criado`);
      }
    }
  }

  await AppDataSource.destroy();
  
  console.log(`\n📊 RESUMO:`);
  console.log(`   ✅ Criadas: ${totalSeeded}`);
  console.log(`   ⏭️  Puladas: ${totalSkipped}`);
  console.log(`   ❌ Erros: ${totalErrors}`);
}

seedInternalRoutesWithPassarelas();