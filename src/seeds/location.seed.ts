import { AppDataSource } from "../config/data-source";
import { Location, LocationType } from "../entities/Location";

async function seedLocations() {
    console.log("Iniciando seed de localizações da UniEvangelica de Anápolis...");
    
    // Inicializar a conexão com o banco de dados
    try {
        await AppDataSource.initialize();
        console.log("Conexão com o banco de dados estabelecida");
    } catch (error) {
        console.error("Erro ao conectar ao banco de dados:", error);
        return;
    }

    // Repositório de locais
    const locationRepository = AppDataSource.getRepository(Location);
    
    // Verifica se já existem dados
    const count = await locationRepository.count();
    if (count > 0) {
        console.log(`Já existem ${count} localizações cadastradas. Pulando seed.`);
        return;
    }

    try {
        const blocks = [
            {
                name: "Bloco A",
                code: "A",
                type: LocationType.BLOCK,
                description: "Prédio administrativo com salas de aula e secretaria",
                block: "A",
                latitude: -16.328286, 
                longitude: -48.953177
            },
            {
                name: "Bloco B",
                code: "B",
                type: LocationType.BLOCK,
                description: "Bloco de salas de aula",
                block: "B",
                latitude: -16.328052,
                longitude: -48.953853
            },
            {
                name: "Bloco C",
                code: "C",
                type: LocationType.BLOCK,
                description: "Bloco com salas de aula e laboratórios",
                block: "C",
                latitude: -16.327378, 
                longitude: -48.953929
            },
            {
                name: "Bloco D",
                code: "D",
                type: LocationType.BLOCK,
                description: "Bloco de salas de aula e coordenações",
                block: "D",
                latitude: -16.328839, 
                longitude: -48.954048
            },
            {
                name: "Bloco E",
                code: "E",
                type: LocationType.BLOCK,
                description: "Bloco com laboratórios de informática",
                block: "E",
                latitude: -16.327931, 
                longitude: -48.953542
            },
            {
                name: "Bloco F",
                code: "F",
                type: LocationType.BLOCK,
                description: "Bloco de salas de aula",
                block: "F",
                latitude: -16.327914,
                longitude: -48.954273
            },
            {
                name: "Bloco G",
                code: "G",
                type: LocationType.BLOCK,
                description: "Bloco do curso de medicina",
                block: "G",
                latitude: -16.327356, 
                longitude: -48.954660
            },
            {
                name: "Bloco H",
                code: "H",
                type: LocationType.BLOCK,
                description: "Bloco de salas de aula",
                block: "H",
                latitude: -16.326741, 
                longitude: -48.954614
            },
            {
                name: "Bloco I",
                code: "I",
                type: LocationType.BLOCK,
                description: "Bloco de laboratórios e salas de aula",
                block: "I",
                latitude: -16.326462, 
                longitude: -48.954159
            },
            {
                name: "Bloco J",
                code: "J",
                type: LocationType.BLOCK,
                description: "Bloco de tecnologia",
                block: "J",
                latitude: -16.327248, 
                longitude: -48.952988
            }
        ];

        console.log("Inserindo blocos...");
        await locationRepository.save(blocks);

        const labs = [
            {
                name: "Laboratório 02",
                code: "E208",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 2,
                block: "E",
                nearbyLandmarks: "Próximo ao elevador",
                accessibilityNotes: "Acessível por elevador"
            },
            {
                name: "Laboratório 03",
                code: "J204",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 2,
                block: "J",
                nearbyLandmarks: "Próximo à escada",
                accessibilityNotes: "Acessível por rampa"
            },
            {
                name: "Laboratório 04",
                code: "C403",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 4,
                block: "C",
                nearbyLandmarks: "No final do corredor",
                accessibilityNotes: "Acessível por elevador"
            },
            {
                name: "Laboratório 05",
                code: "E209",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 2,
                block: "E",
                nearbyLandmarks: "Ao lado do Lab 02",
                accessibilityNotes: "Acessível por elevador"
            },
            {
                name: "Laboratório 06",
                code: "E212",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 2,
                block: "E",
                nearbyLandmarks: "Final do corredor à direita",
                accessibilityNotes: "Acessível por elevador"
            },
            {
                name: "Laboratório 07",
                code: "I207",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 2,
                block: "I",
                nearbyLandmarks: "Lado direito do corredor",
                accessibilityNotes: "Acessível por rampa e elevador"
            },
            {
                name: "Laboratório 08",
                code: "I206",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 2,
                block: "I",
                nearbyLandmarks: "Lado esquerdo do corredor",
                accessibilityNotes: "Acessível por rampa e elevador"
            },
            {
                name: "Laboratório 09",
                code: "B1301",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 3,
                block: "B1",
                nearbyLandmarks: "Próximo à biblioteca",
                accessibilityNotes: "Acessível por elevador"
            },
            {
                name: "Laboratório 10",
                code: "B1302",
                type: LocationType.LABORATORY,
                description: "Laboratório de informática",
                floor: 3,
                block: "B1",
                nearbyLandmarks: "Próximo à biblioteca",
                accessibilityNotes: "Acessível por elevador"
            }
        ];

        console.log("Inserindo laboratórios...");
        await locationRepository.save(labs);

        const classrooms = [
            // Bloco A
            {
                name: "Sala A101",
                code: "A101",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 40 alunos",
                floor: 1,
                block: "A"
            },
            {
                name: "Sala A102",
                code: "A102",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 40 alunos",
                floor: 1,
                block: "A"
            },
            {
                name: "Sala A103",
                code: "A103",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 40 alunos",
                floor: 1,
                block: "A"
            },
            {
                name: "Sala A201",
                code: "A201",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 40 alunos",
                floor: 2,
                block: "A"
            },
            {
                name: "Sala A202",
                code: "A202",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 40 alunos",
                floor: 2,
                block: "A"
            },

            // Bloco B
            {
                name: "Sala B101",
                code: "B101",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 45 alunos",
                floor: 1,
                block: "B"
            },
            {
                name: "Sala B102",
                code: "B102",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 45 alunos",
                floor: 1,
                block: "B"
            },
            {
                name: "Sala B201",
                code: "B201",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 45 alunos",
                floor: 2,
                block: "B"
            },

            // Bloco C
            {
                name: "Sala C101",
                code: "C101",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 50 alunos",
                floor: 1,
                block: "C"
            },
            {
                name: "Sala C201",
                code: "C201",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 50 alunos",
                floor: 2,
                block: "C"
            },
            {
                name: "Sala C301",
                code: "C301",
                type: LocationType.CLASSROOM,
                description: "Sala de aula - Capacidade: 50 alunos",
                floor: 3,
                block: "C"
            },

            // Bloco I (Engenharia)
            {
                name: "Sala I101",
                code: "I101",
                type: LocationType.CLASSROOM,
                description: "Sala de aula de Engenharia - Capacidade: 60 alunos",
                floor: 1,
                block: "I"
            },
            {
                name: "Sala I102",
                code: "I102",
                type: LocationType.CLASSROOM,
                description: "Sala de aula de Engenharia - Capacidade: 60 alunos",
                floor: 1,
                block: "I"
            },
            {
                name: "Sala I103",
                code: "I103",
                type: LocationType.CLASSROOM,
                description: "Sala de aula de Engenharia - Capacidade: 60 alunos",
                floor: 1,
                block: "I"
            }
        ];

        // Inserir salas de aula
        console.log("Inserindo salas de aula...");
        await locationRepository.save(classrooms);

        // Outros locais importantes
        const otherLocations = [
            {
                name: "Biblioteca Central",
                code: "BC",
                type: LocationType.LIBRARY,
                description: "Biblioteca Central da UniEvangelica",
                block: "BC",
                latitude: -16.328862,
                longitude: -48.952634,
                nearbyLandmarks: "Próxima à entrada principal",
                accessibilityNotes: "Acessível por rampa"
            },
            {
                name: "Auditório Carlos Hassel Mendes",
                code: "AUD1",
                type: LocationType.AUDITORIUM,
                description: "Auditório principal para eventos acadêmicos",
                block: "ADM",
                nearbyLandmarks: "Próximo à reitoria",
                accessibilityNotes: "Acessível por rampa e elevador"
            },
            {
                name: "Cantina Central",
                code: "CANT",
                type: LocationType.CAFETERIA,
                description: "Cantina e praça de alimentação",
                latitude: -16.327431,
                longitude: -48.953337,
                nearbyLandmarks: "Entre os blocos C e F",
                accessibilityNotes: "Acesso em nível"
            },
            {
                name: "Secretaria Geral",
                code: "SG",
                type: LocationType.ADMINISTRATIVE,
                description: "Secretaria acadêmica e atendimento aos alunos",
                block: "ADM",
                floor: 1,
                nearbyLandmarks: "Entrada principal do campus",
                accessibilityNotes: "Acessível por rampa"
            },
            {
                name: "Reitoria",
                code: "REI",
                type: LocationType.ADMINISTRATIVE,
                description: "Gabinete da Reitoria e Pró-Reitorias",
                block: "ADM",
                floor: 2,
                nearbyLandmarks: "Prédio Administrativo",
                accessibilityNotes: "Acessível por elevador"
            }
        ];

        // Inserir outros locais importantes
        console.log("Inserindo outros locais importantes...");
        await locationRepository.save(otherLocations);

        console.log("Seed concluído com sucesso!");
        
    } catch (error) {
        console.error("Erro ao executar seed:", error);
    } finally {
        // Fechar conexão com o banco de dados
        await AppDataSource.destroy();
        console.log("Conexão com o banco de dados fechada");
    }
}

// Executar o seed
seedLocations().catch(error => {
    console.error("Erro na execução do seed:", error);
});