import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { StudentProfile } from '../entities/StudentProfile';
import { CreateUserDTO, UserResponseDTO } from '../dto/User';
import { Request } from 'express';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

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

            const studentProfileFields = ['phone', 'studentId'];
            studentProfileFields.forEach(field => {
                if (!req.body.studentProfile[field]) {
                    throw new Error(`Missing required field in studentProfile: ${field}`);
                }
            });
        }
    }//** - Cria um novo usuário */
    public async create(data: CreateUserDTO): Promise<UserResponseDTO> {
        return await AppDataSource.transaction(async (manager) => {
            const userRepository = manager.getRepository(User);
            const studentProfileRepository = manager.getRepository(StudentProfile);

            // Verifica e-mail (case insensitive)
            const existingEmail = await userRepository.createQueryBuilder('user')
                .where('LOWER(user.email) = LOWER(:email)', { email: data.email })
                .andWhere('user.isDeleted = false')
                .getOne();
            if (existingEmail) throw new Error('Email already registered');

            // Verifica matrícula (case insensitive)
            if (data.studentProfile?.studentId) {
                const existingDocument = await studentProfileRepository.createQueryBuilder('studentProfile')
                    .where('LOWER(studentProfile.studentId) = LOWER(:studentId)', { studentId: data.studentProfile.studentId })
                    .getOne();
                if (existingDocument) throw new Error('Document ID (matrícula) already registered');
            }

            // Hash da senha antes de salvar
            if (data.password) {
                const salt = await bcrypt.genSalt(10);
                data.password = await bcrypt.hash(data.password, salt);
            }

            // Gera tokens
            const token = this.generateToken(data.email);
            const refreshToken = await this.generateRefreshToken(data.email);

            const user = userRepository.create({
                ...data,
                refreshToken, // Salva o refresh token no usuário
                isDeleted: false,
                isEmailVerified: false,
                termsAccepted: false
            });
            await userRepository.save(user);

            if (data.studentProfile && user.role === 'student') {
                const studentProfile = studentProfileRepository.create({
                    ...data.studentProfile,
                    studentId: data.studentProfile.studentId || `STD${user.id.toString().padStart(6, '0')}`,
                    user
                });
                await studentProfileRepository.save(studentProfile);
            }

            const completeUser = await userRepository.findOne({
                where: { id: user.id, isDeleted: false },
                relations: ['studentProfile']
            });

            // Retorna a resposta com tokens
            const userResponse = this.mapUserToResponse(completeUser!);
            userResponse.token = token;
            userResponse.refreshToken = refreshToken;
            
            return userResponse;
        });
    }
    //** - Gera um token JWT para o usuário */
    private generateToken(email: string): string {
        return sign(
            { email }, 
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '1h' }
        );
    }

    //** - Gera um refresh token */
    private async generateRefreshToken(email: string): Promise<string> {
        return sign(
            { email }, 
            process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
            { expiresIn: '7d' }
        );
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