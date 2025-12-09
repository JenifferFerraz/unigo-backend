import * as SibApiV3Sdk from '@getbrevo/brevo';
import * as path from 'path';
import * as fs from 'fs';

class EmailService {
    //** - Inicializa o cliente Brevo */
    private static getClient(): SibApiV3Sdk.TransactionalEmailsApi | null {
        if (!process.env.BREVO_API_KEY) {
            console.error('❌ BREVO_API_KEY não configurada');
            return null;
        }

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        apiInstance.setApiKey(
            SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY
        );
        
        return apiInstance;
    }

    //** - Obtém o logo como attachment para o email */
    private static getLogoAttachment(): any[] {
        try {
            const logoPath = path.join(__dirname, '../assets/Logo.png');
            const logoBuffer = fs.readFileSync(logoPath);
            return [{
                content: logoBuffer.toString('base64'),
                name: 'logo.png'
            }];
        } catch (error) {
            console.warn('⚠️ Logo não encontrado');
            return [];
        }
    }

    //** - Envia email de redefinição de senha */
    public static async sendPasswordResetEmail(
        email: string,
        resetLink: string
    ): Promise<boolean> {
        const client = this.getClient();
        
        if (!client) {
            console.warn('⚠️ Cliente de email não configurado. Email não será enviado.');
            if (process.env.NODE_ENV === 'development') {
            }
            return false;
        }

        try {
            const logoSrc = 'https://unigo-frontend.onrender.com/assets/assets/images/Logo.png';

            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.to = [{ email: email }];
            sendSmtpEmail.sender = { 
                email: process.env.EMAIL_FROM || 'contato.unigo@gmail.com', 
                name: 'UniGo' 
            };
            sendSmtpEmail.subject = 'Redefinição de Senha - UniGo';
            sendSmtpEmail.htmlContent = `
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
                        <td style="background-color: #4C40C6; background: linear-gradient(135deg, #4C40C6 0%, #5D52D6 100%); padding: 40px 20px; text-align: center;">
                            <img src="${logoSrc}" alt="UniGo Logo" style="width: 120px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />
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
                            <center>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="border-radius: 8px; background-color: #4C40C6; padding: 16px 40px;">
                                            <a href="${resetLink}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                                Redefinir Senha
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </center>
                            
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
`;

            await client.sendTransacEmail(sendSmtpEmail);
            return true;

        } catch (error: any) {
            console.error('❌ Erro ao enviar email:', error.message);
            
            if (process.env.NODE_ENV === 'development') {
                console.log('Link de reset ():', resetLink);
            }
            
            return false;
        }
    }
}

export default EmailService;
