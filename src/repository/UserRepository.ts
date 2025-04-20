import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { CreateUserDTO } from '../dto/User';

class UserRepository {
    private repository = AppDataSource.getRepository(User);

    public async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({
            where: { email },
            relations: ['studentProfile', 'course']
        });
    }

    public async findByDocumentId(documentId: string): Promise<User | null> {
        return await this.repository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.studentProfile', 'studentProfile')
            .where('studentProfile.documentId = :documentId', { documentId })
            .getOne();
    }

    public create(data: CreateUserDTO): User {
        return this.repository.create(data);
    }

    public async save(user: User): Promise<User> {
        return await this.repository.save(user);
    }
}

export default new UserRepository();