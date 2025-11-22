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

const extras = [
    'Estrutura-Patio.geojson',
    'Estrutura-Estacionamento.geojson',
    'Estrutura-Externa.geojson',
    'Estrutura-Quadra.geojson',
    'Estrutura-Extra-1.geojson',
    'Estrutura-Extra-2.geojson',
];

async function seedAllBlocks() {
    try {
        await AppDataSource.initialize();
        const structureRepo = AppDataSource.getRepository(Structure);
        const routeRepo = AppDataSource.getRepository(InternalRoute);
        const roomRepo = AppDataSource.getRepository(require('../entities/Room').Room);

        const blocos = [
            { nome: 'A', pasta: 'Bloco-A' },
            { nome: 'B1', pasta: 'Bloco-B-1', pastaRota: 'B-1' }, 
            { nome: 'B2', pasta: 'Bloco-B-2', pastaRota: 'B-2' },
            { nome: 'C', pasta: 'Bloco-C' },
            { nome: 'D', pasta: 'Bloco-D' },
            { nome: 'E', pasta: 'Bloco-E' },
            { nome: 'F', pasta: 'Bloco-F' },
            { nome: 'G', pasta: 'Bloco-G' },
            { nome: 'H', pasta: 'Bloco-H' },
            { nome: 'I', pasta: 'Bloco-I' },
            { nome: 'J', pasta: 'Bloco-J' },
        ];

        for (let blocoObj of blocos) {
            const bloco = blocoObj.nome;
            const pasta = blocoObj.pasta;
            const pastaRota = (blocoObj as any).pastaRota || bloco; 

            let estruturaFile = null;
            let estruturaGeo = null;
            let estruturaFeature = null;
            let nomeEstrutura = null;

            const estruturaPath1 = path.join(__dirname, `../mapeamentos/${pasta}/${bloco} ESTRUTURA.geojson`);
            const estruturaPath2 = path.join(__dirname, `../mapeamentos/${pasta}/Bloco-${bloco}-Estrutura.geojson`);
            const estruturaPath3 = path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-ESTRUTURA.geojson`);
            const estruturaPath4 = path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-Estrutura.geojson`);

            if (fs.existsSync(estruturaPath1)) estruturaFile = estruturaPath1;
            else if (fs.existsSync(estruturaPath2)) estruturaFile = estruturaPath2;
            else if (fs.existsSync(estruturaPath3)) estruturaFile = estruturaPath3;
            else if (fs.existsSync(estruturaPath4)) estruturaFile = estruturaPath4;

            if (estruturaFile && fs.existsSync(estruturaFile)) {
                estruturaGeo = readGeoJsonIfExists(estruturaFile);
                estruturaFeature = estruturaGeo && estruturaGeo.features && estruturaGeo.features[0] ? estruturaGeo.features[0] : null;
                nomeEstrutura = estruturaFeature?.properties?.name || `BLOCO ${bloco}`;
            } else {
                nomeEstrutura = `BLOCO ${bloco}`;
            }

            let estrutura = await structureRepo.findOne({ where: { name: nomeEstrutura } });
            let estruturaId = null;

            if (!estrutura && estruturaFeature) {
                let poly = estruturaFeature.geometry;
                let centroid = [0, 0];
                if (poly && poly.type === 'Polygon' && Array.isArray(poly.coordinates[0])) {
                    const coords = poly.coordinates[0];
                    centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]).map(x => x / coords.length);
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

            if (bloco === 'B2' || bloco === 'C') {
                const escadasPath = path.join(__dirname, '../mapeamentos/Extras/escadas.geojson');
              

                if (fs.existsSync(escadasPath)) {
                    const escadasGeojson = readGeoJsonIfExists(escadasPath);

                    const estruturaB2 = await structureRepo.findOne({
                        where: [
                            { name: 'B2 ESTRUTURA' },
                            { name: 'BLOCO B2' }
                        ]
                    });

                    const estruturaC = await structureRepo.findOne({
                        where: [
                            { name: 'C ESTRUTURA' },
                            { name: 'BLOCO C' }
                        ]
                    });

                 

                    for (let andar = 0; andar <= 3; andar++) {

                        for (const feature of escadasGeojson.features) {
                            const nome = (feature.properties?.name || '').toUpperCase();

                            if (nome.includes('ESCADA') || nome === 'ESCADA') {

                                let geometryGeo = null;
                                let centroidGeo = null;

                                if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
                                    geometryGeo = feature.geometry;

                                    const coords = feature.geometry.coordinates[0];
                                    const avgLng = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
                                    const avgLat = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
                                    centroidGeo = { type: 'Point', coordinates: [avgLng, avgLat] };

                                }
                                else if (feature.geometry?.type === 'Point') {
                                    geometryGeo = feature.geometry;
                                    centroidGeo = feature.geometry;
                                }

                                if (!geometryGeo || !centroidGeo) {
                                    console.warn(`      ❌ Geometria inválida, pulando...`);
                                    continue;
                                }

                                if (estruturaB2 && bloco === 'B2') {
                                    const roomNameB2 = `ESCADA ENTRE B2 E C - ANDAR ${andar}`;

                                    const existingB2 = await roomRepo.findOne({
                                        where: {
                                            name: roomNameB2,
                                            structure: { id: estruturaB2.id },
                                            floor: andar
                                        }
                                    });

                                    if (!existingB2) {
                                        try {
                                            await AppDataSource.query(
                                                `INSERT INTO room (name, description, geometry, centroid, "structureId", floor)
                                     VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3),4326), ST_SetSRID(ST_GeomFromGeoJSON($4),4326), $5, $6)`,
                                                [
                                                    roomNameB2,
                                                    `Escada de conexão entre B2 e C - Andar ${andar}`,
                                                    JSON.stringify(geometryGeo), 
                                                    JSON.stringify(centroidGeo), 
                                                    estruturaB2.id,
                                                    andar
                                                ]
                                            );
                                        } catch (err) {
                                            console.error(`      ❌ Erro ao criar room B2:`, err.message);
                                        }
                                    } 
                                }

                           
                                if (estruturaC && bloco === 'C') {
                                    const roomNameC = `ESCADA ENTRE B2 E C - ANDAR ${andar}`;

                                    const existingC = await roomRepo.findOne({
                                        where: {
                                            name: roomNameC,
                                            structure: { id: estruturaC.id },
                                            floor: andar
                                        }
                                    });

                                    if (!existingC) {
                                        try {
                                            await AppDataSource.query(
                                                `INSERT INTO room (name, description, geometry, centroid, "structureId", floor)
                                     VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3),4326), ST_SetSRID(ST_GeomFromGeoJSON($4),4326), $5, $6)`,
                                                [
                                                    roomNameC,
                                                    `Escada de conexão entre B2 e C - Andar ${andar}`,
                                                    JSON.stringify(geometryGeo), 
                                                    JSON.stringify(centroidGeo), 
                                                    estruturaC.id,
                                                    andar
                                                ]
                                            );
                                        } catch (err) {
                                            console.error(`      ❌ Erro ao criar room C:`, err.message);
                                        }
                                    } 
                                }
                            }
                        }
                    }
                } else {
                    console.warn(`   ⚠️  Arquivo escadas.geojson não encontrado`);
                }
            }

            for (let andar = 0; andar <= 5; andar++) {
                let roomsGeojson = { features: [] };
                let rotasGeojson = { features: [] };
                let roomFile = null;

                if (andar === 0) {
                    const filesTerreo = [
                        path.join(__dirname, `../mapeamentos/${pasta}/Bloco-${bloco}-TERREO.geojson`),
                        path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-TERREO.geojson`),
                        path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-Terreo.geojson`),
                        path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-TÉRREO.geojson`),
                        path.join(__dirname, `../mapeamentos/${pasta}/Bloco-${bloco}-Terreo.geojson`),
                    ];
                    for (const f of filesTerreo) {
                        if (fs.existsSync(f)) {
                            roomFile = f;
                            break;
                        }
                    }
                } else {
                    const filesAndar = [
                        path.join(__dirname, `../mapeamentos/${pasta}/Bloco-${bloco}-${andar}-Andar.geojson`),
                        path.join(__dirname, `../mapeamentos/${pasta}/Bloco-${bloco}-${andar}-ANDAR.geojson`),
                        path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-${andar}-Andar.geojson`),
                        path.join(__dirname, `../mapeamentos/${pasta}/${bloco}-${andar}-ANDAR.geojson`),
                    ];
                    for (const f of filesAndar) {
                        if (fs.existsSync(f)) {
                            roomFile = f;
                            break;
                        }
                    }
                }

                if (roomFile && fs.existsSync(roomFile)) {
                    roomsGeojson = readGeoJsonIfExists(roomFile);
                } else {
                    roomsGeojson = { features: [] };
                }

                const rotaPatterns = [
                    `../mapeamentos/${pasta}/Rota-${bloco}-${andar === 0 ? 'TERREO' : andar + '-ANDAR'}.geojson`,
                    `../mapeamentos/${pasta}/Rota-${bloco}-${andar === 0 ? 'Terreo' : andar + '-Andar'}.geojson`,
                    `../mapeamentos/${pasta}/Rota-${bloco}-${andar}-Andar.geojson`,
                    `../mapeamentos/${pasta}/Rota-${bloco}-${andar}-ANDAR.geojson`,

                    `../mapeamentos/${pasta}/Rota-${pastaRota}-${andar === 0 ? 'Terreo' : andar + '-Andar'}.geojson`,
                    `../mapeamentos/${pasta}/Rota-${pastaRota}-${andar === 0 ? 'TERREO' : andar + '-ANDAR'}.geojson`,
                    `../mapeamentos/${pasta}/Rota-${pastaRota}-${andar}-Andar.geojson`,
                    `../mapeamentos/${pasta}/Rota-${pastaRota}-${andar}-ANDAR.geojson`,
                ];

                for (const p of rotaPatterns) {
                    const abs = path.join(__dirname, p);
                    if (fs.existsSync(abs)) {
                        rotasGeojson = readGeoJsonIfExists(abs);
                        if (rotasGeojson.features.length > 0) {
                            break;
                        }
                    }
                }

                if (rotasGeojson.features.length === 0 && roomsGeojson.features.length === 0) continue;

                if (!estruturaId) {
                    let poly = roomsGeojson.features[0]?.geometry;
                    let centroid = [0, 0];
                    let validGeometry = false;

                    if (poly && poly.type === 'Polygon' && Array.isArray(poly.coordinates[0])) {
                        const coords = poly.coordinates[0];
                        centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]).map(x => x / coords.length);
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

                if (estrutura && Array.isArray(estrutura.floors) && !estrutura.floors.includes(andar)) {
                    estrutura.floors.push(andar);
                    await structureRepo.save(estrutura);
                }

                const featuresByName = new Map<string, any>();

                for (const feature of roomsGeojson.features) {
                    const roomName = String(feature?.properties?.name || '').trim().toUpperCase();

                    if (!roomName || roomName === 'SEM NOME' || roomName === 'BURACO') {
                        continue;
                    }

                    const geometryType = feature.geometry?.type;

                    if (!featuresByName.has(roomName)) {
                        featuresByName.set(roomName, feature);
                        continue;
                    }

                    const existingFeature = featuresByName.get(roomName);
                    const existingType = existingFeature.geometry?.type;

                    if (geometryType === 'Polygon' && existingType === 'Point') {
                        featuresByName.set(roomName, feature);
                    }
                }


                for (const [roomName, feature] of featuresByName.entries()) {
                    let centroidGeo = null;

                    if (feature.geometry && feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0])) {
                        const coords = feature.geometry.coordinates[0];
                        const centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]).map(x => x / coords.length);
                        centroidGeo = { type: 'Point', coordinates: centroid };
                    } else if (feature.geometry && feature.geometry.type === 'Point') {
                        centroidGeo = { type: 'Point', coordinates: feature.geometry.coordinates };
                    }

                    if (!feature.geometry) {
                        console.error(`   ❌ ${roomName} sem geometria!`);
                        continue;
                    }

                    if (!centroidGeo) {
                        console.error(`   ❌ ${roomName} sem centroid!`);
                        continue;
                    }

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
                            const existingGeometry = existingRoom.geometry;
                            const existingType = existingGeometry?.type;
                            const newType = feature.geometry.type;

                            if (newType === 'Polygon' && existingType === 'Point') {
                                await AppDataSource.query(
                                    `UPDATE room 
                                     SET geometry = ST_SetSRID(ST_GeomFromGeoJSON($1),4326),
                                         centroid = ST_SetSRID(ST_GeomFromGeoJSON($2),4326)
                                     WHERE id = $3`,
                                    [
                                        JSON.stringify(feature.geometry),
                                        JSON.stringify(centroidGeo),
                                        existingRoom.id
                                    ]
                                );
                            }
                        }
                    } catch (err) {
                        console.error(`   ❌ Erro ao processar ${roomName}:`, err);
                    }
                }

                for (const feature of rotasGeojson.features) {
                    const isStairs = feature.properties?.isStairs === true ||
                        (feature.properties?.name && feature.properties.name.toUpperCase().includes('ESCADA')) ||
                        String(feature.properties?.id || '').toLowerCase().includes('escad');

                    const properties = { ...feature.properties, isStairs };

                    const existingRoute = await routeRepo.findOne({
                        where: {
                            structure: { id: estruturaId },
                            floor: andar,
                            properties: { id: feature.properties?.id } as any
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
                    }

              
                    if (isStairs) {
                        const andarNome = andar === 0 ? 'TÉRREO' : `${andar}°ANDAR`;
                        const roomName = `ESCADA ${andarNome} ${bloco}`;

                        let centroidGeo = null;
                        if (feature.geometry?.type === 'MultiLineString' && feature.geometry.coordinates?.length > 0) {
                            const firstLine = feature.geometry.coordinates[0];
                            if (firstLine && firstLine.length > 0) {
                                const avgLng = firstLine.reduce((sum, p) => sum + p[0], 0) / firstLine.length;
                                const avgLat = firstLine.reduce((sum, p) => sum + p[1], 0) / firstLine.length;
                                centroidGeo = { type: 'Point', coordinates: [avgLng, avgLat] };
                            }
                        } else if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
                            const coords = feature.geometry.coordinates[0];
                            const avgLng = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
                            const avgLat = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
                            centroidGeo = { type: 'Point', coordinates: [avgLng, avgLat] };
                        }

                        if (centroidGeo) {
                            const existingStairRoom = await roomRepo.findOne({
                                where: {
                                    name: roomName,
                                    structure: { id: estruturaId },
                                    floor: andar
                                }
                            });

                            if (!existingStairRoom) {
                                try {
                                    await AppDataSource.query(
                                        `INSERT INTO room (name, description, geometry, centroid, "structureId", floor)
                                         VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3),4326), ST_SetSRID(ST_GeomFromGeoJSON($4),4326), $5, $6)`,
                                        [
                                            roomName,
                                            `Escada do ${andarNome} - BLOCO ${bloco}`,
                                            JSON.stringify(centroidGeo), 
                                            JSON.stringify(centroidGeo),
                                            estruturaId,
                                            andar
                                        ]
                                    );
                                } catch (err) {
                                    console.error(`   ❌ Erro ao criar room escada: ${err}`);
                                }
                            }
                        }
                    }
                }
            }
        }

        for (let extraFile of extras) {
            const extraPath = path.join(__dirname, '../mapeamentos/', extraFile);
            const extraGeojson = readGeoJsonIfExists(extraPath);

            for (const feature of extraGeojson.features) {
                let estrutura = await structureRepo.findOne({ where: { name: feature.properties?.name } });

                if (!estrutura) {
                    let centroid = [0, 0];
                    if (feature.geometry && feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0])) {
                        const coords = feature.geometry.coordinates[0];
                        centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]).map(x => x / coords.length);
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
    }
}

seedAllBlocks()
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erro ao rodar seed de todos os blocos:', err);
        process.exit(1);
    });