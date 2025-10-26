import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { Structure } from '../entities/Structure';
const fs = require('fs');
const path = require('path');
function readGeoJsonIfExists(filePath) {
    return fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
        : { features: [] };
}

const estruturaExternaGeojsonJ = {
    "type": "FeatureCollection", "features": [{ "geometry": { "coordinates": [[[-48.9438649, -16.2929752], [-48.9433466, -16.2930797], [-48.9433001, -16.2928684], [-48.9435348, -16.2928209], [-48.943514, -16.2927271], [-48.9432801, -16.2927747], [-48.9432335, -16.2925631], [-48.9437525, -16.2924587], [-48.9438649, -16.2929752]]], "crs": { "properties": { "name": "EPSG:4326" }, "type": "name" }, "type": "Polygon" }, "properties": { "name": "BLOCO J", "felt:color": "#333333", "felt:fillOpacity": 0, "felt:hasLongDescription": false, "felt:id": "8vhLqNa1SOmNLmuSq6EllC", "felt:locked": false, "felt:ordering": 1760054835727141, "felt:parentId": "BY7zOHrqRwKxjc4P7RG9C8A", "felt:radiusDisplayAngle": 90, "felt:showArea": false, "felt:strokeOpacity": 1, "felt:strokeStyle": "solid", "felt:strokeWidth": 4, "felt:type": "Polygon", "felt:widthScale": 1 }, "type": "Feature" }]
};
const rotasGeojsonJTerreo = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Rota-J-Terreo.geojson'));
const rotasGeojsonJ1 = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Rota-J-1-Andar.geojson'));
const rotasGeojsonJ2 = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Rota-J-2-Andar.geojson'));
const rotasGeojsonJ3 = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Rota-J-3-Andar.geojson'));
const roomsGeojsonJTerreo = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Bloco-J-Terreo.geojson'));
const roomsGeojsonJ1 = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Bloco-J-1-Andar.geojson'));
const roomsGeojsonJ2 = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Bloco-J-2-Andar.geojson'));
const roomsGeojsonJ3 = readGeoJsonIfExists(path.join(__dirname, '../mapeamentos/Bloco-J-3-Andar.geojson'));

async function seedBlocoJ() {
    try {
        await AppDataSource.initialize();
        const structureRepo = AppDataSource.getRepository(Structure);
        const routeRepo = AppDataSource.getRepository(InternalRoute);
        const estruturaExternaFeatureJ = estruturaExternaGeojsonJ.features[0];
        let estruturaExternaJ = await structureRepo.findOne({ where: { name: estruturaExternaFeatureJ.properties.name } });
        if (!estruturaExternaJ) {
            let centroidJ = [0, 0];
            if (estruturaExternaFeatureJ.geometry && estruturaExternaFeatureJ.geometry.type === 'Polygon' && estruturaExternaFeatureJ.geometry.coordinates && estruturaExternaFeatureJ.geometry.coordinates[0]) {
                const coordsJ = estruturaExternaFeatureJ.geometry.coordinates[0];
                centroidJ = coordsJ.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]).map(x => x / coordsJ.length);
            }
            estruturaExternaJ = structureRepo.create({
                name: estruturaExternaFeatureJ.properties.name,
                description: 'Estrutura externa BLOCO J',
                geometry: estruturaExternaFeatureJ.geometry,
                centroid: { type: 'Point', coordinates: centroidJ },
                floors: [0],
            });
            await structureRepo.save(estruturaExternaJ);
            console.log('Estrutura externa J criada:', estruturaExternaJ.id);
        }
        const roomRepo = AppDataSource.getRepository(require('../entities/Room').Room);
        async function insertRooms(features, floor) {
            for (const feature of features) {
                let roomName = feature?.properties?.name;
                if (!roomName) {
                    roomName = 'SEM NOME';
                    console.warn('Room feature sem nome, inserindo como SEM NOME:', feature);
                }
                let centroidGeo = null;
                if (feature.geometry && feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates) && Array.isArray(feature.geometry.coordinates[0])) {
                    const coords = feature.geometry.coordinates[0];
                    if (Array.isArray(coords) && coords.length > 0 && Array.isArray(coords[0])) {
                        const centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]).map(x => x / coords.length);
                        centroidGeo = { type: 'Point', coordinates: centroid };
                    }
                } else if (feature.geometry && feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
                    centroidGeo = { type: 'Point', coordinates: feature.geometry.coordinates };
                }
                await AppDataSource.query(
                    `INSERT INTO room (name, description, geometry, centroid, "structureId", floor)
                    VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3),4326), ST_SetSRID(ST_GeomFromGeoJSON($4),4326), $5, $6)`,
                    [
                        roomName,
                        `Sala interna andar ${floor === 0 ? 'térreo' : floor + 'º andar'} BLOCO J`,
                        JSON.stringify(feature.geometry),
                        JSON.stringify(centroidGeo),
                        estruturaExternaJ.id,
                        floor
                    ]
                );
                console.log(`Room salvo: ${roomName} (andar ${floor})`);
            }
        }

        await insertRooms(roomsGeojsonJTerreo.features, 0);
        await insertRooms(roomsGeojsonJ1.features, 1);
        await insertRooms(roomsGeojsonJ2.features, 2);
        await insertRooms(roomsGeojsonJ3.features, 3);

        async function insertRoutes(features, floor) {
            for (const feature of features) {
                const isStairs = feature.properties.isStairs === true ||
                    (feature.properties.name && feature.properties.name.toUpperCase().includes('ESCADA'));
                const properties = { ...feature.properties, isStairs };
                const route = routeRepo.create({
                    structure: estruturaExternaJ,
                    floor,
                    geometry: feature.geometry,
                    properties,
                });
                await routeRepo.save(route);
            }
        }

        await insertRoutes(rotasGeojsonJTerreo.features, 0);
        await insertRoutes(rotasGeojsonJ1.features, 1);
        await insertRoutes(rotasGeojsonJ2.features, 2);
        await insertRoutes(rotasGeojsonJ3.features, 3);
    } catch (err) {
        console.error('Erro ao rodar seed bloco J:', err);
    } finally {
        await AppDataSource.destroy();
        console.log('Conexão com o banco de dados fechada');
    }
}

seedBlocoJ()
    .then(() => {
        console.log('Seed bloco J concluído!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Erro ao rodar seed bloco J:', err);
        process.exit(1);
    });
