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

// Estruturas extras (ex: pátio, estacionamento, etc)
const extras = [
    'Estrutura-Patio.geojson',
    'Estrutura-Estacionamento.geojson',
    'Estrutura-Externa.geojson',
    'Estrutura-Quadra.geojson',
    'Estrutura-Extra-1.geojson',
    'Estrutura-Extra-2.geojson',
    // Adicione outros arquivos extras conforme necessário
];

async function seedAllBlocks() {
    try {
        await AppDataSource.initialize();
        const structureRepo = AppDataSource.getRepository(Structure);
        const routeRepo = AppDataSource.getRepository(InternalRoute);
        const roomRepo = AppDataSource.getRepository(require('../entities/Room').Room);

        // Blocos de A até J
        // Mapeamento de blocos que compartilham estrutura
        // Mapeamento de blocos que compartilham arquivo de geometria
        // Mapeamento de blocos para arquivo de estrutura (pode estar em outra pasta)
        const estruturaCompartilhada: { [bloco: string]: { estruturaPath: string } } = {
            'B1': { estruturaPath: '../mapeamentos/Bloco-B-2/B1-B2-Estrutura.geojson' },
            'B2': { estruturaPath: '../mapeamentos/Bloco-B-2/B1-B2-Estrutura.geojson' },
            'B':  { estruturaPath: '../mapeamentos/Bloco-C/B-2-C-Estrutura.geojson' },
            'C':  { estruturaPath: '../mapeamentos/Bloco-C/B-2-C-Estrutura.geojson' },
            // Adicione outros blocos compartilhados aqui se necessário
        };
        // Lista de blocos conforme as pastas
        const blocos = [
            // { nome: 'A', pasta: 'Bloco-A' },
            // { nome: 'B1', pasta: 'Bloco-B-1' },
            // { nome: 'B2', pasta: 'Bloco-B-2' },
            // { nome: 'C', pasta: 'Bloco-C' },
            // { nome: 'D', pasta: 'Bloco-D' },
            // { nome: 'E', pasta: 'Bloco-E' },
            { nome: 'F', pasta: 'Bloco-F' },
            // { nome: 'G', pasta: 'Bloco-G' },
            { nome: 'H', pasta: 'Bloco-H' },
            // { nome: 'I', pasta: 'Bloco-I' },
            { nome: 'J', pasta: 'Bloco-J' },
        ];
        for (let blocoObj of blocos) {
            const bloco = blocoObj.nome;
            const pasta = blocoObj.pasta;
            // Procurar arquivo de estrutura do bloco (pode estar em outra pasta)
            let estruturaFile = null;
            let estruturaGeo = null;
            let estruturaFeature = null;
            let nomeEstrutura = `BLOCO ${bloco}`;
            // Adiciona busca por arquivo com hífen para Bloco J
            const estruturaPath1 = path.join(__dirname, `../mapeamentos/${pasta}/${bloco} ESTRUTURA.geojson`);
            const estruturaPath2 = path.join(__dirname, `../mapeamentos/${pasta}/Bloco-${bloco}-Estrutura.geojson`);
            const estruturaPath3 = path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-ESTRUTURA.geojson`);
            if (estruturaCompartilhada[bloco]) {
                estruturaFile = path.join(__dirname, estruturaCompartilhada[bloco].estruturaPath);
            } else {
                if (fs.existsSync(estruturaPath1)) estruturaFile = estruturaPath1;
                else if (fs.existsSync(estruturaPath2)) estruturaFile = estruturaPath2;
                else if (fs.existsSync(estruturaPath3)) estruturaFile = estruturaPath3;
            }
            if (estruturaFile && fs.existsSync(estruturaFile)) {
                estruturaGeo = readGeoJsonIfExists(estruturaFile);
                estruturaFeature = estruturaGeo && estruturaGeo.features && estruturaGeo.features[0] ? estruturaGeo.features[0] : null;
                // Se o arquivo de estrutura tem propriedade 'name', usa esse nome
                if (estruturaFeature?.properties?.name) {
                    nomeEstrutura = estruturaFeature.properties.name;
                }
            }
            let estrutura = await structureRepo.findOne({ where: { name: nomeEstrutura } });
            let estruturaId = null;
            if (!estrutura && estruturaFeature) {
                let poly = estruturaFeature.geometry;
                let centroid = [0,0];
                let validGeometry = false;
                if (poly && poly.type === 'Polygon' && Array.isArray(poly.coordinates[0])) {
                    const coords = poly.coordinates[0];
                    centroid = coords.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]).map(x => x/coords.length);
                    validGeometry = true;
                } else if (poly && poly.type === 'Point' && Array.isArray(poly.coordinates)) {
                    centroid = poly.coordinates;
                    validGeometry = true;
                }
                if (validGeometry) {
                    estrutura = structureRepo.create({
                        name: nomeEstrutura,
                        description: `Estrutura do ${nomeEstrutura}`,
                        geometry: poly,
                        centroid: { type: 'Point', coordinates: centroid },
                        floors: [],
                    });
                    await structureRepo.save(estrutura);
                    estruturaId = estrutura.id;
                } else {
                    console.warn(`[SEED WARNING] Estrutura do bloco ${bloco} não criada: geometria inválida ou ausente.`);
                }
            } else if (estrutura) {
                estruturaId = estrutura.id;
            }

            for (let andar = 0; andar <= 5; andar++) {
                let roomsGeojson = { features: [] };
                let rotasGeojson = { features: [] };
                // Padrão genérico para todos os blocos (sem forçar B1/B2)
                const roomPatterns = [
                    `../mapeamentos/Bloco-${bloco}/Bloco-${bloco}-${andar === 0 ? 'TERREO' : andar + '-ANDAR'}.geojson`,
                    `../mapeamentos/Bloco-${bloco}/${bloco}-${andar === 0 ? 'Terreo' : andar + '-Andar'}.geojson`,
                    `../mapeamentos/Bloco-${bloco}/${bloco} ${andar === 0 ? 'TÉRREO' : andar + '° ANDAR'}.geojson`,
                    `../mapeamentos/Bloco-${bloco}/${bloco}-${andar}-Andar.geojson`,
                    `../mapeamentos/Bloco-${bloco}/${bloco}-${andar === 0 ? 'TERREO' : andar + '-ANDAR'}.geojson`,
                ];
                for (const p of roomPatterns) {
                    const abs = path.join(__dirname, p);
                    if (fs.existsSync(abs)) {
                        roomsGeojson = readGeoJsonIfExists(abs);
                        if (roomsGeojson.features.length > 0) break;
                    }
                }
                const rotaPatterns = [
                    `../mapeamentos/Bloco-${bloco}/Rota-${bloco}-${andar === 0 ? 'TERREO' : andar + '-ANDAR'}.geojson`,
                    `../mapeamentos/Bloco-${bloco}/Rota-${bloco}-${andar}-Andar.geojson`,
                    `../mapeamentos/Bloco-${bloco}/Rota-${bloco}-${andar === 0 ? 'Terreo' : andar + '-Andar'}.geojson`,
                    `../mapeamentos/Bloco-${bloco}/Rota-${bloco}-${andar === 0 ? 'TÉRREO' : andar + '° ANDAR'}.geojson`,
                ];
                for (const p of rotaPatterns) {
                    const abs = path.join(__dirname, p);
                    if (fs.existsSync(abs)) {
                        rotasGeojson = readGeoJsonIfExists(abs);
                        if (rotasGeojson.features.length > 0) break;
                    }
                }
                if (rotasGeojson.features.length === 0 && roomsGeojson.features.length === 0) continue;
                if (rotasGeojson.features.length === 0 && roomsGeojson.features.length === 0) continue;

                // Se não criou estrutura ainda (não tinha arquivo de estrutura), cria usando sala
                if (!estruturaId) {
                    let poly = roomsGeojson.features[0]?.geometry;
                    let centroid = [0,0];
                    let validGeometry = false;
                    if (poly && poly.type === 'Polygon' && Array.isArray(poly.coordinates[0])) {
                        const coords = poly.coordinates[0];
                        centroid = coords.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]).map(x => x/coords.length);
                        validGeometry = true;
                    } else if (poly && poly.type === 'Point' && Array.isArray(poly.coordinates)) {
                        centroid = poly.coordinates;
                        validGeometry = true;
                    }
                    if (validGeometry) {
                        estrutura = structureRepo.create({
                            name: `BLOCO ${bloco}`,
                            description: `Estrutura do BLOCO ${bloco}`,
                            geometry: poly,
                            centroid: { type: 'Point', coordinates: centroid },
                            floors: [],
                        });
                        await structureRepo.save(estrutura);
                        estruturaId = estrutura.id;
                    } else {
                        console.warn(`[SEED WARNING] Estrutura do bloco ${bloco} não criada: geometria inválida ou ausente (fallback).`);
                    }
                }

                // Atualiza floors da estrutura
                if (estrutura && Array.isArray(estrutura.floors) && !estrutura.floors.includes(andar)) {
                    estrutura.floors.push(andar);
                    await structureRepo.save(estrutura);
                }

                // Salvar rooms
                for (const feature of roomsGeojson.features) {
                    let roomName = feature?.properties?.name || 'SEM NOME';
                    let centroidGeo = null;
                    if (feature.geometry && feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0])) {
                        const coords = feature.geometry.coordinates[0];
                        const centroid = coords.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]).map(x => x/coords.length);
                        centroidGeo = { type: 'Point', coordinates: centroid };
                    } else if (feature.geometry && feature.geometry.type === 'Point') {
                        centroidGeo = { type: 'Point', coordinates: feature.geometry.coordinates };
                    }
                    console.log(`[ROOM SEED] Bloco: ${bloco}, Andar: ${andar}, Room: ${roomName}, EstruturaId: ${estruturaId}`);
                    try {
                        const existingRoom = await roomRepo.findOne({
                            where: {
                                name: roomName,
                                structure: { id: estruturaId },
                                floor: andar
                            }
                        });
                        if (!existingRoom) {
                            await AppDataSource.query(
                                `INSERT INTO room (name, description, geometry, centroid, "structureId", floor)
                                VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3),4326), ST_SetSRID(ST_GeomFromGeoJSON($4),4326), $5, $6)`,
                                [
                                    roomName,
                                    `Sala interna andar ${andar === 0 ? 'térreo' : andar + 'º andar'} BLOCO ${bloco}`,
                                    JSON.stringify(feature.geometry),
                                    JSON.stringify(centroidGeo),
                                    estruturaId,
                                    andar
                                ]
                            );
                        } else {
                            console.log(`[ROOM SKIP] Room já existe: ${roomName}, Bloco: ${bloco}, Andar: ${andar}`);
                        }
                    } catch (err) {
                        console.error(`[ROOM ERROR] Bloco: ${bloco}, Andar: ${andar}, Room: ${roomName}, Erro:`, err);
                    }
                }

                // Salvar rotas
                for (const feature of rotasGeojson.features) {
                    const isStairs = feature.properties.isStairs === true ||
                        (feature.properties.name && feature.properties.name.toUpperCase().includes('ESCADA'));
                    const properties = { ...feature.properties, isStairs };
                    // Verifica se já existe rota igual (mesmo estrutura, andar e geometria)
                    const existingRoute = await routeRepo.findOne({
                        where: {
                            structure: { id: estruturaId },
                            floor: andar,
                            geometry: feature.geometry
                        }
                    });
                    if (!existingRoute) {
                        const route = routeRepo.create({
                            structure: { id: estruturaId },
                            floor: andar,
                            geometry: feature.geometry,
                            properties,
                        });
                        await routeRepo.save(route);
                    } else {
                        console.log(`[ROUTE SKIP] Rota já existe para estrutura ${estruturaId}, andar ${andar}`);
                    }
                }
            }
        }

        // Extras (estruturas externas)
        for (let extraFile of extras) {
            const extraPath = path.join(__dirname, '../mapeamentos/', extraFile);
            const extraGeojson = readGeoJsonIfExists(extraPath);
            for (const feature of extraGeojson.features) {
                let estrutura = await structureRepo.findOne({ where: { name: feature.properties?.name } });
                if (!estrutura) {
                    let centroid = [0,0];
                    if (feature.geometry && feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0])) {
                        const coords = feature.geometry.coordinates[0];
                        centroid = coords.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]).map(x => x/coords.length);
                    }
                    estrutura = structureRepo.create({
                        name: feature.properties?.name || 'EXTRA',
                        description: 'Estrutura extra',
                        geometry: feature.geometry,
                        centroid: { type: 'Point', coordinates: centroid },
                        floors: [0],
                    });
                    await structureRepo.save(estrutura);
                }
            }
        }
    } catch (err) {
        console.error('Erro ao rodar seed de todos os blocos:', err);
    } finally {
        await AppDataSource.destroy();
        console.log('Conexão com o banco de dados fechada');
    }
}

seedAllBlocks()
    .then(() => {
        console.log('Seed de todos os blocos concluído!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Erro ao rodar seed de todos os blocos:', err);
        process.exit(1);
    });
