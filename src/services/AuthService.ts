import { sign } from 'jsonwebtoken';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { LoginDTO } from '../dto/Auth';
import { Request } from 'express';
import bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

class AuthService {
    //** - Repositório de usuários */
    private static userRepository = AppDataSource.getRepository(User);

    //** - Cria o transporter de email apenas se as credenciais estiverem configuradas */
    private static getTransporter() {
        console.log('🔧 Configurando transporter de email...');
        console.log('SMTP_HOST:', process.env.SMTP_HOST);
        console.log('SMTP_PORT:', process.env.SMTP_PORT);
        console.log('SMTP_USER:', process.env.SMTP_USER ? '***configurado***' : 'não configurado');
        console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configurado***' : 'não configurado');

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('❌ SMTP credentials are not configured');
            return null;
        }

        console.log('✅ Criando transporter com as credenciais fornecidas...');
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            debug: true,
            logger: true
        });
    }
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
        console.log('🔐 Tentativa de login para o email:', data.email);
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

        console.log('✅ Senha válida, gerando tokens...');
        const token = this.generateToken(user.email);
        const refreshToken = await this.generateRefreshToken(user.email);

        user.refreshToken = refreshToken;
        await this.userRepository.save(user);
        console.log('✅ Login bem-sucedido para:', data.email);

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
    public static async requestPasswordReset(email: string): Promise<void> {
        console.log('🔄 Solicitação de redefinição de senha para:', email);
        const user = await this.userRepository.findOne({
            where: { email }
        });

        if (!user) {
            console.log('⚠️ Usuário não encontrado:', email);
            throw new Error('Se um usuário com este email existir, ele receberá instruções de redefinição de senha');
        }

        console.log('✅ Usuário encontrado, gerando token de reset...');
        const resetToken = sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        user.refreshToken = resetToken;
        await this.userRepository.save(user);
        console.log('✅ Token salvo no banco de dados');

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        console.log('🔗 Link de reset gerado:', resetLink);

        const transporter = this.getTransporter();
        if (transporter) {
            console.log('📧 Preparando para enviar email...');
            console.log('De:', process.env.SMTP_USER);
            console.log('Para:', email);
            // Não aguarda o envio do email para não bloquear a resposta
            transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Redefinição de Senha - UniGo',
                attachments: [{
                    filename: 'Logo.png',
                    path: path.join(__dirname, '../assets/Logo.png'),
                    cid: 'logo'
                }],
                html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de Senha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" cellspacing="0" cellpadding="0" border="0">
                    <!-- Header com logo e cor da marca -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4C40C6 0%, #5D52D6 100%); padding: 40px 20px; text-align: center;">
                            <img src="cid:logo" alt="UniGo Logo" style="width: 120px; height: auto; margin-bottom: 10px;" />
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Redefinição de Senha</h1>
                        </td>
                    </tr>
                    
                    <!-- Conteúdo -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Olá,
                            </p>
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Recebemos uma solicitação para redefinir a senha da sua conta UniGo. Clique no botão abaixo para criar uma nova senha:
                            </p>
                            
                            <!-- Botão de ação -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 8px; background: linear-gradient(135deg, #4C40C6 0%, #5D52D6 100%);">
                                        <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                            Redefinir Senha
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px 0;">
                                Ou copie e cole este link no seu navegador:
                            </p>
                            <p style="color: #4C40C6; font-size: 14px; word-break: break-all; background-color: #f8f8f8; padding: 12px; border-radius: 6px; margin: 0 0 30px 0;">
                                ${resetLink}
                            </p>
                            
                            <!-- Informações importantes -->
                            <div style="background-color: #FFF4E6; border-left: 4px solid #FFA726; padding: 16px; border-radius: 6px; margin: 0 0 20px 0;">
                                <p style="color: #E65100; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 500;">
                                    ⚠️ Este link expirará em 1 hora por motivos de segurança.
                                </p>
                            </div>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                                Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. Sua senha permanecerá inalterada.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 30px 20px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                                Este é um email automático, por favor não responda.
                            </p>
                            <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 0;">
                                © ${new Date().getFullYear()} UniGo. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
                }).then((info) => {
                    console.log('✅ Email enviado com sucesso!');
                    console.log('Message ID:', info.messageId);
                    console.log('Response:', info.response);
                    console.log('Accepted:', info.accepted);
                    console.log('Rejected:', info.rejected);
                }).catch((emailError: any) => {
                    console.error('❌ Erro ao enviar email de redefinição de senha');
                    console.error('Erro:', emailError.message);
                    console.error('Código:', emailError.code);
                    console.error('Command:', emailError.command);
                    console.error('Stack:', emailError.stack);
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Link de reset (desenvolvimento):', resetLink);
                    }
                });
        } else {
            console.warn('SMTP não configurado. Email de redefinição de senha não será enviado.');
            if (process.env.NODE_ENV === 'development') {
                console.log('Link de reset (desenvolvimento):', resetLink);
            }
        }
    }
    //** - Completa o processo de redefinição de senha */
    public static async resetPassword(token: string, newPassword: string): Promise<void> {
        console.log('🔑 Tentando redefinir senha com token...');
        const user = await this.userRepository.findOne({
            where: { refreshToken: token }
        });

        if (!user) {
            console.log('❌ Token inválido ou expirado');
            throw new Error('Invalid or expired reset token');
        }

        console.log('✅ Token válido, atualizando senha...');
        user.password = await bcrypt.hash(newPassword, 10);
        user.refreshToken = null;
        await this.userRepository.save(user);
        console.log('✅ Senha redefinida com sucesso para:', user.email);
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