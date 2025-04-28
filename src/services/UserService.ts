import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { StudentProfile } from '../entities/StudentProfile';
import { CreateUserDTO, UserResponseDTO } from '../dto/User';
import { Request } from 'express';
import bcrypt from 'bcrypt';

/**
 * Serviço responsável pelo gerenciamento de usuários
 * Inclui operações de CRUD e validações
 */
class UserService {
    private userRepository = AppDataSource.getRepository(User);
    private studentProfileRepository = AppDataSource.getRepository(StudentProfile);
//** - Valida os dados de criação de usuário */
    public validateCreateUser(req: Request): void {
        const requiredFields = ['name', 'email', 'password', 'cpf'];
        requiredFields.forEach(field => {
            if (!req.body[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        });
        req.body.termsAccepted = false;

        if (req.body.role === 'student' || !req.body.role) {
            if (!req.body.studentProfile) {
                throw new Error('Student profile is required for student role');
            }

            const studentProfileFields = ['phone'];
            studentProfileFields.forEach(field => {
                if (!req.body.studentProfile[field]) {
                    throw new Error(`Missing required field in studentProfile: ${field}`);
                }
            });
        }
    }//** - Cria um novo usuário */
    public async create(data: CreateUserDTO): Promise<UserResponseDTO> {
        try {
            const existingEmail = await this.userRepository.findOneBy({
                email: data.email,
                isDeleted: false
            });
            if (existingEmail) {
                throw new Error('Email already registered');
            }

            if (data.studentProfile?.studentId) {
                const existingDocument = await this.studentProfileRepository.findOneBy({
                    studentId: data.studentProfile.studentId
                });
                if (existingDocument) {
                    throw new Error('Document ID already registered');
                }
            }

            const user = this.userRepository.create({
                ...data,
                isDeleted: false,
                isEmailVerified: false,
                termsAccepted: false
            });
            await this.userRepository.save(user);

            if (data.studentProfile && user.role === 'student') {
                const studentProfile = this.studentProfileRepository.create({
                    ...data.studentProfile,
                    studentId: data.studentProfile.studentId || `STD${user.id.toString().padStart(6, '0')}`,
                    user
                });
                await this.studentProfileRepository.save(studentProfile);
            }

            const completeUser = await this.userRepository.findOne({
                where: {
                    id: user.id,
                    isDeleted: false
                },
                relations: ['studentProfile']
            });

            return this.mapUserToResponse(completeUser!);
        } catch (error: any) {
            throw new Error(error.message || 'Error creating user');
        }
    }
//** - Atualiza os dados de um usuário */
    private mapUserToResponse(user: User): UserResponseDTO {
        return {
            id: user.id,
            name: user.name,
            cpf: user.cpf,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isDeleted: user.isDeleted,
            termsAccepted: user.termsAccepted,
            documentId: user.studentProfile?.studentId,
            phone: user.studentProfile?.phone,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}

export default new UserService();