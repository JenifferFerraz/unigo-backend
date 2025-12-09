import { sign } from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { LoginDTO } from '../dto/Auth';
import { Request } from 'express';
import bcrypt from 'bcryptjs';
import EmailService from './EmailService';

class AuthService {
    //** - Repositório de usuários */
    private static userRepository = AppDataSource.getRepository(User);

    //** - Valida os dados de login */

    public static validateLogin(req: Request): void {
        const requiredFields = ['email', 'password'];
        requiredFields.forEach(field => {
            if (!req.body[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        });
    }
    //** - Realiza o login do usuário */
    public static async login(data: LoginDTO): Promise<any> {
        const user = await this.userRepository.findOne({
            where: {
                email: data.email,
                isDeleted: false
            },
            relations: ['studentProfile', 'course']
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const validPassword = await bcrypt.compare(data.password, user.password);

        if (!validPassword) {
            throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user.email);
        const refreshToken = await this.generateRefreshToken(user.email);

        user.refreshToken = refreshToken;
        await this.userRepository.save(user);

        const { password, ...userData } = user;

        let studentProfile = null;
        if (user.studentProfile) {
            studentProfile = {
                ...user.studentProfile,
                courseId: user.studentProfile.courseId
            };
        }

        const courseId = user.course?.id || user.studentProfile?.courseId || null;

        return {
            ...userData,
            courseId,
            studentProfile,
            token,
            refreshToken,
            termsAccepted: user.termsAccepted,
            requiresTermsAcceptance: !user.termsAccepted
        };
    }
    //** - Gera um token JWT para o usuário */
    private static generateToken(email: string): string {
        return sign(
            { email },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '15m' }
        );
    }
    //** - Gera um token de atualização para o usuário */
    private static async generateRefreshToken(email: string): Promise<string> {
        const refreshToken = sign(
            { email },
            process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret',
            { expiresIn: '15d' }
        );

        return refreshToken;
    }
    //** - Retorna os dados do perfil do usuário atual */
    public static async getProfile(email: string): Promise<Partial<User>> {
        const user = await this.userRepository.findOne({
            where: { email },
            relations: ['studentProfile', 'course']
        });

        if (!user) {
            throw new Error('User not found');
        }

        const { password, refreshToken, ...userData } = user;
        return userData;
    }

    //** - Retorna o usuário pelo email */
    public static async getUserByEmail(email: string): Promise<User | null> {
        if (!email) {
            throw new Error('Email is required');
        }
        return await this.userRepository.findOne({
            where: { email }
        });
    }

    //** - Valida os dados para redefinição de senha */
    public static validatePasswordReset(req: Request): void {
        if (!req.body.email) {
            throw new Error('Email is required');
        }
    }
    //** - Inicia o processo de redefinição de senha */
    public static async requestPasswordReset(email: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { email }
        });

        if (!user) {
            return false;
        }

        const resetToken = sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        user.refreshToken = resetToken;
        await this.userRepository.save(user);

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Envia email de forma assíncrona sem bloquear a resposta
        EmailService.sendPasswordResetEmail(email, resetLink).catch(() => {});
        
        return true;
    }
    //** - Completa o processo de redefinição de senha */
    public static async resetPassword(token: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { refreshToken: token }
        });

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.refreshToken = null;
        await this.userRepository.save(user);
    }
    //** - Valida os dados para aceitação dos termos */
    public static async acceptTerms(userId: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
                isDeleted: false
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        user.termsAccepted = true;

        await this.userRepository.save(user);
    }
}


export default AuthService;