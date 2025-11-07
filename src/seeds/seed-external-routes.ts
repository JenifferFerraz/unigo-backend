import { AppDataSource } from '../config/data-source';
import { ExternalRoute } from '../entities/ExternalRoute';
import * as fs from 'fs';
import * as path from 'path';

async function seedExternalRoutes() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ExternalRoute);

  const files = [
    { name: 'Rota-Externa-Carro', path: '../mapeamentos/Rota-Externa-A-Carro/Rota-Externa-Carro.geojson' },
    { name: 'Rota-Externa-A-Pe', path: '../mapeamentos/Rota-Externa-A-Pe/Rota-Externa-A-Pe.geojson' }
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, file.path);
    if (!fs.existsSync(filePath)) continue;
    const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const feature of geojson.features) {
      await repo.save(repo.create({
        name: file.name,
        description: feature.properties?.['felt:routeMode'] || feature.properties?.['routeMode'] || '',
        geometry: feature.geometry,
        properties: feature.properties
      }));
    }
  }
  await AppDataSource.destroy();
  console.log('Seed de rotas externas concluído!');
}

seedExternalRoutes();
