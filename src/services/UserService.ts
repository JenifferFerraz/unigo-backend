import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { StudentProfile } from '../entities/StudentProfile';
import { CreateUserDTO, UserResponseDTO } from '../dto/User';
import { Request } from 'express';
import bcrypt from 'bcrypt';

class UserService {
    private userRepository = AppDataSource.getRepository(User);
    private studentProfileRepository = AppDataSource.getRepository(StudentProfile);

    public validateCreateUser(req: Request): void {
        console.log('Starting user validation with data:', JSON.stringify(req.body, null, 2));
        
        const requiredFields = ['name', 'email', 'password', 'cpf'];
        requiredFields.forEach(field => {
            if (!req.body[field]) {
                console.error(`Validation failed: Missing ${field}`);
                throw new Error(`Missing required field: ${field}`);
            }
        });
        req.body.termsAccepted = false;
        console.log('Basic fields validated successfully');

        if (req.body.role === 'student' || !req.body.role) {
            console.log('Validating student profile data');
            if (!req.body.studentProfile) {
                console.error('Validation failed: Missing student profile');
                throw new Error('Student profile is required for student role');
            }

            const studentProfileFields = ['phone'];
            studentProfileFields.forEach(field => {
                if (!req.body.studentProfile[field]) {
                    console.error(`Validation failed: Missing ${field} in student profile`);
                    throw new Error(`Missing required field in studentProfile: ${field}`);
                }
            });
            console.log('Student profile validated successfully');
        }
        
        console.log('All validations passed successfully');
    }

    public async create(data: CreateUserDTO): Promise<UserResponseDTO> {
        try {
            console.log('Starting user creation with data:', JSON.stringify(data, null, 2));

            console.log('Checking for existing email');
            const existingEmail = await this.userRepository.findOneBy({
                email: data.email,
                isDeleted: false
            });
            if (existingEmail) {
                console.error('Email already exists:', data.email);
                throw new Error('Email already registered');
            }

            if (data.studentProfile?.studentId) {
                console.log('Checking for existing student ID');
                const existingDocument = await this.studentProfileRepository.findOneBy({
                    studentId: data.studentProfile.studentId
                });
                if (existingDocument) {
                    console.error('Student ID already exists:', data.studentProfile.studentId);
                    throw new Error('Document ID already registered');
                }
            }

            console.log('Creating user entity');
            const user = this.userRepository.create({
                name: data.name,
                email: data.email,
                avatar: data.avatar,
                password: await bcrypt.hash(data.password, 10),
                cpf: data.cpf,
                role: data.role || 'student',
                isDeleted: false,
                isEmailVerified: false,
                termsAccepted: false,
            });

            console.log('Saving user to database');
            await this.userRepository.save(user);
            console.log('User saved successfully with ID:', user.id);

            if (data.studentProfile && user.role === 'student') {
                console.log('Creating student profile');
                const studentProfile = this.studentProfileRepository.create({
                    ...data.studentProfile,
                    studentId: data.studentProfile.studentId || `STD${user.id.toString().padStart(6, '0')}`,
                    user
                });
                await this.studentProfileRepository.save(studentProfile);
                console.log('Student profile saved successfully');
            }

            console.log('Loading complete user data');
            const completeUser = await this.userRepository.findOne({
                where: {
                    id: user.id,
                    isDeleted: false
                },
                relations: ['studentProfile']
            });

            console.log('Mapping user response');
            return this.mapUserToResponse(completeUser!);
        } catch (error: any) {
            console.error('Error in user creation:', error);
            throw new Error(error.message || 'Error creating user');
        }
    }

    private mapUserToResponse(user: User): UserResponseDTO {
        console.log('Mapping user data to response:', user.id);
        const response = {
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
        console.log('Response mapped successfully');
        return response;
    }
}

export default new UserService();