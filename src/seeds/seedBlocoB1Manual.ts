import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { Structure } from '../entities/Structure';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🔥 SEED MANUAL: Importa rotas do BLOCO B1 forçando padrões corretos
 */
async function seedBlocoB1Manual() {
  console.log('🏗️  Iniciando seed manual do BLOCO B1...\n');

  await AppDataSource.initialize();
  const routeRepo = AppDataSource.getRepository(InternalRoute);
  const structureRepo = AppDataSource.getRepository(Structure);

  // Blocos a importar
  const blocos = [
    {
      nome: 'B1 ESTRUTURA',
      pasta: 'Bloco-B-1',
      arquivos: [
        { andar: 0, paths: [
          '../mapeamentos/Bloco-B-1/Rota-B-1-1-Andar.geojson',
          '../mapeamentos/Bloco-B-1/Rota-B-1-1-ANDAR.geojson',
        ]},
        { andar: 1, paths: [
          '../mapeamentos/Bloco-B-1/Rota-B-1-2-Andar.geojson',
          '../mapeamentos/Bloco-B-1/Rota-B-1-2-ANDAR.geojson',
        ]},
        { andar: 2, paths: [
          '../mapeamentos/Bloco-B-1/Rota-B-1-3-Andar.geojson',
          '../mapeamentos/Bloco-B-1/Rota-B-1-3-ANDAR.geojson',
        ]},
        { andar: 3, paths: [
          '../mapeamentos/Bloco-B-1/Rota-B-1-4-Andar.geojson',
          '../mapeamentos/Bloco-B-1/Rota-B-1-4-ANDAR.geojson',
        ]},
      ]
    },
    {
      nome: 'B2 ESTRUTURA',
      pasta: 'Bloco-B-2',
      arquivos: [
        { andar: 0, paths: [
          '../mapeamentos/Bloco-B-2/Rota-B-2-Terreo.geojson',
          '../mapeamentos/Bloco-B-2/Rota-B-2-Terreo.geojson',
        ]},
        { andar: 2, paths: [
          '../mapeamentos/Bloco-B-2/Rota-B-2-2-Andar.geojson',
          '../mapeamentos/Bloco-B-2/Rota-B-2-2-ANDAR.geojson',
        ]},
        { andar: 3, paths: [
          '../mapeamentos/Bloco-B-2/Rota-B-2-3-Andar.geojson',
          '../mapeamentos/Bloco-B-2/Rota-B-2-3-ANDAR.geojson',
        ]},
        { andar: 4, paths: [
          '../mapeamentos/Bloco-B-2/Rota-B-2-4-Andar.geojson',
          '../mapeamentos/Bloco-B-2/Rota-B-2-4-ANDAR.geojson',
        ]},
      ]
    }
  ];

  let totalImportadas = 0;
  let totalEscadas = 0;
  let totalErros = 0;

  for (const bloco of blocos) {
    // Buscar estrutura
    const estrutura = await structureRepo.findOne({ where: { name: bloco.nome } });
    if (!estrutura) {
      console.error(`❌ Estrutura ${bloco.nome} não encontrada no banco!`);
      totalErros++;
      continue;
    }
    console.log(`\n✅ Estrutura encontrada: ${estrutura.name} (ID: ${estrutura.id})`);

    // Processar cada andar
    for (const { andar, paths } of bloco.arquivos) {
      console.log(`\n📂 Processando ${bloco.nome} andar ${andar}...`);
      let geojson: any = null;
      let arquivoEncontrado: string | null = null;
      for (const relativePath of paths) {
        const fullPath = path.join(__dirname, relativePath);
        if (fs.existsSync(fullPath)) {
          geojson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          arquivoEncontrado = relativePath;
          break;
        }
      }
      if (!geojson) {
        console.warn(`   ⚠️  Nenhum arquivo encontrado para andar ${andar}`);
        console.warn(`   Tentou: ${paths.join(', ')}`);
        totalErros++;
        continue;
      }
      console.log(`   ✅ Arquivo: ${arquivoEncontrado}`);
      console.log(`   Features: ${geojson.features.length}`);
      for (const feature of geojson.features) {
        const isStairs = feature.properties?.isStairs === true;
        const forceStairs = isStairs || 
          String(feature.properties?.id || '').toLowerCase().includes('escad') ||
          feature.properties?.type === 'stairs';
        const properties = {
          ...feature.properties,
          isStairs: forceStairs,
          floor: andar
        };
        const existing = await routeRepo.findOne({
          where: {
            structure: { id: estrutura.id },
            floor: andar,
            properties: { id: feature.properties?.id } as any
          }
        });
        if (existing) {
          console.log(`      ⏭️  Feature ${feature.properties?.id} já existe`);
          continue;
        }
        try {
          const route = routeRepo.create({
            structure: estrutura,
            floor: andar,
            geometry: feature.geometry,
            properties
          });
          await routeRepo.save(route);
          totalImportadas++;
          if (forceStairs) {
            totalEscadas++;
            console.log(`      🪜 Escada importada: ID ${feature.properties?.id}`);
          } else {
            console.log(`      ✅ Rota importada: ID ${feature.properties?.id}`);
          }
        } catch (error: any) {
          console.error(`      ❌ Erro: ${error.message}`);
          totalErros++;
        }
      }
      if (!estrutura.floors.includes(andar)) {
        estrutura.floors.push(andar);
        await structureRepo.save(estrutura);
        console.log(`   ✅ Andar ${andar} adicionado à estrutura`);
      }
    }
  }

  await AppDataSource.destroy();

  // Resumo
  console.log(`\n\n📊 RESUMO DO SEED:`);
  console.log(`   ✅ Rotas importadas: ${totalImportadas}`);
  console.log(`   🪜 Escadas: ${totalEscadas}`);
  console.log(`   ❌ Erros: ${totalErros}`);
  console.log(`\n🏁 Seed manual concluído!`);
}

seedBlocoB1Manual()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Erro fatal:', err);
    process.exit(1);
  });