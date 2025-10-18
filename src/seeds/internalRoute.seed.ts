import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { Structure } from '../entities/Structure';

const estruturaExternaGeojson = {
    "type": "FeatureCollection", "features": [{ "geometry": { "coordinates": [[[-48.9438649, -16.2929752], [-48.9433466, -16.2930797], [-48.9433001, -16.2928684], [-48.9435348, -16.2928209], [-48.943514, -16.2927271], [-48.9432801, -16.2927747], [-48.9432335, -16.2925631], [-48.9437525, -16.2924587], [-48.9438649, -16.2929752]]], "crs": { "properties": { "name": "EPSG:4326" }, "type": "name" }, "type": "Polygon" }, "properties": { "name": "BLOCO HI", "felt:color": "#333333", "felt:fillOpacity": 0, "felt:hasLongDescription": false, "felt:id": "8vhLqNa1SOmNLmuSq6EllC", "felt:locked": false, "felt:ordering": 1760054835727141, "felt:parentId": "BY7zOHrqRwKxjc4P7RG9C8A", "felt:radiusDisplayAngle": 90, "felt:showArea": false, "felt:strokeOpacity": 1, "felt:strokeStyle": "solid", "felt:strokeWidth": 4, "felt:type": "Polygon", "felt:widthScale": 1 }, "type": "Feature" }]
};

const estruturaInternaGeojson = {
    "type": "FeatureCollection",
    "features": [
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9435809,-16.2930314],[-48.9434243,-16.2930632],[-48.9434041,-16.2929698],[-48.9435606,-16.2929383],[-48.9435809,-16.2930314]]]}, "properties": {"name": "H105/106"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9434235,-16.2930634],[-48.9433471,-16.2930788],[-48.9433267,-16.2929851],[-48.9434033,-16.2929698],[-48.9434235,-16.2930634]]]}, "properties": {"name": "H104"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.943535,-16.2928218],[-48.9435554,-16.2929147],[-48.9433992,-16.2929466],[-48.9433784,-16.2928535],[-48.943535,-16.2928218]]]}, "properties": {"name": "H101/102"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9433774,-16.2928536],[-48.9433982,-16.2929467],[-48.9433216,-16.2929621],[-48.9433013,-16.292869],[-48.9433774,-16.2928536]]]}, "properties": {"name": "H103"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9437082,-16.2930059],[-48.9436297,-16.2930216],[-48.9436143,-16.2929512],[-48.9436913,-16.2929357],[-48.9437082,-16.2930059]]]}, "properties": {"name": "ESCADA H TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9437859,-16.2929899],[-48.9437094,-16.2930053],[-48.9436878,-16.2929127],[-48.9437656,-16.2928965],[-48.9437859,-16.2929899]]]}, "properties": {"name": "H107"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9438638,-16.2929745],[-48.9437874,-16.2929898],[-48.9437668,-16.2928961],[-48.9438435,-16.2928811],[-48.9438638,-16.2929745]]]}, "properties": {"name": "H108"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9438385,-16.2928583],[-48.9438005,-16.2928658],[-48.9437797,-16.292771],[-48.9438178,-16.2927632],[-48.9438385,-16.2928583]]]}, "properties": {"name": "BF H TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9437996,-16.2928658],[-48.9437609,-16.2928742],[-48.9437401,-16.2927791],[-48.943779,-16.2927712],[-48.9437996,-16.2928658]]]}, "properties": {"name": "BM H TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9437393,-16.2927793],[-48.94376,-16.2928744],[-48.9436837,-16.2928897],[-48.9436625,-16.2927948],[-48.9437393,-16.2927793]]]}, "properties": {"name": "H109"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9436618,-16.292795],[-48.9436828,-16.2928899],[-48.9436042,-16.2929058],[-48.9435835,-16.2928104],[-48.9436618,-16.292795]]]}, "properties": {"name": "5110"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.943624,-16.2927748],[-48.9435772,-16.2927846],[-48.9435689,-16.2927448],[-48.9436158,-16.2927357],[-48.943624,-16.2927748]]]}, "properties": {"name": "ESCADA MEIO TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9435137,-16.2927262],[-48.9433969,-16.2927499],[-48.9433768,-16.2926572],[-48.9434939,-16.2926336],[-48.9435137,-16.2927262]]]}, "properties": {"name": "I104"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9433961,-16.2927501],[-48.9432809,-16.2927736],[-48.9432605,-16.2926805],[-48.943376,-16.2926573],[-48.9433961,-16.2927501]]]}, "properties": {"name": "I103"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9433112,-16.2925485],[-48.9433322,-16.2926422],[-48.9432555,-16.2926576],[-48.9432345,-16.2925638],[-48.9433112,-16.2925485]]]}, "properties": {"name": "I102"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9433332,-16.292642],[-48.9433121,-16.2925483],[-48.9433896,-16.2925326],[-48.9434105,-16.2926263],[-48.9433332,-16.292642]]]}, "properties": {"name": "I101"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.943469,-16.2925166],[-48.9434824,-16.292578],[-48.9434041,-16.2925942],[-48.9433903,-16.2925325],[-48.943469,-16.2925166]]]}, "properties": {"name": "ESCADA I TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.943544,-16.2925017],[-48.9435512,-16.2925318],[-48.9435237,-16.2925372],[-48.943517,-16.2925071],[-48.943544,-16.2925017]]]}, "properties": {"name": "BM I TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9435669,-16.2924971],[-48.9435768,-16.2925412],[-48.9435555,-16.2925455],[-48.9435451,-16.2925016],[-48.9435669,-16.2924971]]]}, "properties": {"name": "BF I TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9435543,-16.2925464],[-48.943559,-16.2925658],[-48.9435312,-16.2925713],[-48.9435268,-16.2925517],[-48.9435543,-16.2925464]]]}, "properties": {"name": "BPCF I TÉRREO"}},
        {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-48.9435633,-16.2927184],[-48.9435312,-16.2925723],[-48.94356,-16.2925667],[-48.9435551,-16.2925466],[-48.9435778,-16.2925421],[-48.9435677,-16.292497],[-48.9437519,-16.2924597],[-48.9437977,-16.2926714],[-48.9435633,-16.2927184]]]}, "properties": {"name": "SECRETARIA/COORDENAÇÃO"}}
    ]
};

const rotasGeojson = {
    "type": "FeatureCollection",
    "name": "Rota-H-terreo",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": [
        { "type": "Feature", "properties": { "id": 1, "isBathroom": false, "isStairs": false, "isDoor": true }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943291892192789, -16.292980244492579], [-48.943322780299155, -16.29297446287789]]] } },
        { "type": "Feature", "properties": { "id": 2, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943322780299155, -16.29297446287789], [-48.943387675793232, -16.292961335827229], [-48.943401445469995, -16.293020760890002], [-48.9433774, -16.2930249]]] } },
        { "type": "Feature", "properties": { "id": 3, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943387675793232, -16.292961335827229], [-48.943376015519981, -16.292904826400012], [-48.9433514, -16.2929088]]] } },
        { "type": "Feature", "properties": { "id": 4, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943387675793232, -16.292961335827229], [-48.94342816886342, -16.292952540534078], [-48.943439819110317, -16.293011102354679], [-48.9434923, -16.2930011]]] } },
        { "type": "Feature", "properties": { "id": 5, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943427827398921, -16.292949852991395], [-48.943415989699922, -16.292894734084712], [-48.9434674, -16.2928845]]] } },
        { "type": "Feature", "properties": { "id": 7, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.94342816886342, -16.292952540534078], [-48.943539617836805, -16.292929377448196], [-48.943550243279986, -16.292988810440008], [-48.9434923, -16.2930011]]] } },
        { "type": "Feature", "properties": { "id": 8, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943539617836805, -16.292929377448196], [-48.943527291119985, -16.292873006360011], [-48.9434674, -16.2928845]]] } },
        { "type": "Feature", "properties": { "id": 9, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943539617836805, -16.292929377448196], [-48.943582082076276, -16.292920746070195]]] } },
        { "type": "Feature", "properties": { "id": 10, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943582082076276, -16.292920746070195], [-48.943603795341275, -16.293028138705196]]] } },
        { "type": "Feature", "properties": { "id": 11, "isBathroom": false, "isStairs": false, "isDoor": true }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943603795341275, -16.293028138705196], [-48.94361275756728, -16.293056959278378]]] } },
        { "type": "Feature", "properties": { "id": 13, "isBathroom": false, "isStairs": true, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943582082076276, -16.292920746070195], [-48.943648637624975, -16.292908412675015], [-48.9436656, -16.2929888]]] } },
        { "type": "Feature", "properties": { "id": 16, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943648637624975, -16.292908412675015], [-48.943672988390098, -16.292904033992809], [-48.943658548784974, -16.292839556195016], [-48.9436338, -16.292844]]] } },
        { "type": "Feature", "properties": { "id": 19, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943672988390098, -16.292904033992809], [-48.943707014573491, -16.292897239727896], [-48.943716972464969, -16.292955881915013], [-48.9437418, -16.2929515]]] } },
        { "type": "Feature", "properties": { "id": 20, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943707014573491, -16.292897239727896], [-48.943694467107733, -16.292839597536481], [-48.943716, -16.292834]]] } },
        { "type": "Feature", "properties": { "id": 21, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943707014573491, -16.292897239727896], [-48.943788242369962, -16.29288026864004]]] } },
        { "type": "Feature", "properties": { "id": 22, "isBathroom": true, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943788242369962, -16.29288026864004], [-48.9437735, -16.2928237]]] } },
        { "type": "Feature", "properties": { "id": 24, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943788242369962, -16.29288026864004], [-48.943799732002475, -16.29293942157388], [-48.9438147, -16.2929367]]] } },
        { "type": "Feature", "properties": { "id": 27, "isBathroom": true, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943788242369962, -16.29288026864004], [-48.943821800129143, -16.292873821814528], [-48.9438081, -16.292816]]] } },
        { "type": "Feature", "properties": { "id": 29, "isBathroom": false, "isStairs": false, "isDoor": true }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943821800129143, -16.292873821814528], [-48.94386439216958, -16.292865463952054]]] } },
        { "type": "Feature", "properties": { "id": 30, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943582082076276, -16.292920746070195], [-48.943545634055049, -16.292768585292372]]] } },
        { "type": "Feature", "properties": { "id": 32, "isBathroom": false, "isStairs": true, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943545634055049, -16.292768585292372], [-48.9435973, -16.2927582]]] } },
        { "type": "Feature", "properties": { "id": 32, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943545634055049, -16.292768585292372], [-48.943513038455436, -16.292614847543476], [-48.94345015353862, -16.292628442812642]]] } },
        { "type": "Feature", "properties": { "id": 34, "isBathroom": false, "isStairs": true, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.94345015353862, -16.292628442812642], [-48.943434, -16.2925476]]] } },
        { "type": "Feature", "properties": { "id": 36, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.94345015353862, -16.292628442812642], [-48.943390205409379, -16.292640585793947], [-48.943402343375382, -16.292709423619826], [-48.9434664, -16.2926969]]] } },
        { "type": "Feature", "properties": { "id": 37, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943397399399629, -16.29263867174318], [-48.943385510725165, -16.292583413367986], [-48.943363, -16.292587]]] } },
        { "type": "Feature", "properties": { "id": 38, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943390205409379, -16.292640585793947], [-48.943342097351909, -16.292650127916747], [-48.943353753259913, -16.292708721843226], [-48.9433097, -16.2927182]]] } },
        { "type": "Feature", "properties": { "id": 41, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943341913304984, -16.29265020087502], [-48.94331687458498, -16.292655417275018], [-48.94330597916985, -16.292598495784897], [-48.9432847, -16.2926033]]] } },
        { "type": "Feature", "properties": { "id": 35, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.94331687458498, -16.292655417275018], [-48.943263145664986, -16.292666893355019]]] } },
        { "type": "Feature", "properties": { "id": 338, "isBathroom": false, "isStairs": false, "isDoor": true }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943263145664986, -16.292666893355019], [-48.943222567377944, -16.292675176929716]]] } },
        { "type": "Feature", "properties": { "id": 41, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943510364782782, -16.292602048872883], [-48.9435823, -16.2925884]]] } },
        { "type": "Feature", "properties": { "id": 42, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943513038455436, -16.292614847543476], [-48.943510364782782, -16.292602048872883], [-48.943499470505394, -16.292549679739853], [-48.943537504505251, -16.292541582890717]]] } },
        { "type": "Feature", "properties": { "id": 44, "isBathroom": true, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943537504505251, -16.292541582890717], [-48.9435355, -16.2925239]]] } },
        { "type": "Feature", "properties": { "id": 47, "isBathroom": true, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943537504505251, -16.292541582890717], [-48.9435643, -16.2925367]]] } },
        { "type": "Feature", "properties": { "id": 47, "isBathroom": false, "isStairs": false, "isDoor": false }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.943499470505394, -16.292549679739853], [-48.94349162398499, -16.292517704315024]]] } },
        { "type": "Feature", "properties": { "id": 48, "isBathroom": false, "isStairs": false, "isDoor": true }, "geometry": { "type": "MultiLineString", "coordinates": [[[-48.94349162398499, -16.292517704315024], [-48.943483884199004, -16.292478933933868]]] } }
    ]

};

async function seedAll() {
    try {
        await AppDataSource.initialize();
        const structureRepo = AppDataSource.getRepository(Structure);
        const routeRepo = AppDataSource.getRepository(InternalRoute);

        const estruturaExternaFeature = estruturaExternaGeojson.features[0];
        let estruturaExterna = await structureRepo.findOne({ where: { name: estruturaExternaFeature.properties.name } });
        if (!estruturaExterna) {
            let centroid = [0, 0];
            if (
                estruturaExternaFeature.geometry &&
                estruturaExternaFeature.geometry.type === 'Polygon' &&
                estruturaExternaFeature.geometry.coordinates &&
                estruturaExternaFeature.geometry.coordinates[0]
            ) {
                const coords = estruturaExternaFeature.geometry.coordinates[0];
                centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]).map(x => x / coords.length);
            }
            estruturaExterna = structureRepo.create({
                name: estruturaExternaFeature.properties.name,
                description: 'Estrutura externa BLOCO HI',
                geometry: estruturaExternaFeature.geometry,
                centroid: { type: 'Point', coordinates: centroid },
                floors: [0], 
            });
            await structureRepo.save(estruturaExterna);
            console.log('Estrutura externa criada:', estruturaExterna.id);
        }

        const roomRepo = AppDataSource.getRepository(require('../entities/Room').Room);
        for (const feature of estruturaInternaGeojson.features) {
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
                    feature.properties.name,
                    'Sala interna andar térreo BLOCO HI',
                    JSON.stringify(feature.geometry),
                    JSON.stringify(centroidGeo),
                    estruturaExterna.id,
                    0
                ]
            );
            console.log('Room salvo:', feature.properties.name);
        }

        for (const feature of rotasGeojson.features) {
            const route = routeRepo.create({
                structure: estruturaExterna,
                floor: 0,
                geometry: feature.geometry,
                properties: feature.properties,
            });
            await routeRepo.save(route);
            console.log('Rota interna salva:', route.id);
        }
    } catch (err) {
        console.error('Erro ao rodar seed:', err);
    } finally {
        await AppDataSource.destroy();
        console.log('Conexão com o banco de dados fechada');
    }
}

seedAll()
    .then(() => {
        console.log('Seed de estruturas e rotas concluído!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Erro ao rodar seed:', err);
        process.exit(1);
    });