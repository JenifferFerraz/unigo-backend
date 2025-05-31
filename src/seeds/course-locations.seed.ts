import { AppDataSource } from "../config/data-source";
import { Course } from "../entities/Course";
import { Location, CourseLocation, LocationType } from "../entities/Location";

async function seedCourseLocations() {
    console.log("Iniciando seed de horários de aulas...");
    
    try {
        await AppDataSource.initialize();
        console.log("Conexão com o banco de dados estabelecida");
        
        const courseRepository = AppDataSource.getRepository(Course);
        const locationRepository = AppDataSource.getRepository(Location);
        const courseLocationRepository = AppDataSource.getRepository(CourseLocation);
        
        const count = await courseLocationRepository.count();
        if (count > 0) {
            console.log(`Já existem ${count} horários de aula cadastrados. Pulando seed.`);
            return;
        }

        const course = await courseRepository.findOneBy({ id: 1 });        const classrooms = await locationRepository.find({
            where: { type: LocationType.CLASSROOM },
            take: 3
        });

        if (!course || classrooms.length === 0) {
            console.log("Nenhum curso ou sala encontrada. Execute primeiro os seeds de cursos e locais.");
            return;
        }

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const courseLocations = [];

        for (let i = 0; i < days.length; i++) {
            courseLocations.push({
                course: course,
                location: classrooms[i % classrooms.length],
                dayOfWeek: days[i],
                startTime: "19:00",
                endTime: "22:30"
            });
        }

        await courseLocationRepository.save(courseLocations);
        console.log(`${courseLocations.length} horários de aula cadastrados com sucesso!`);

    } catch (error) {
        console.error("Erro ao cadastrar horários de aula:", error);
    } finally {
        await AppDataSource.destroy();
    }
}

seedCourseLocations();
