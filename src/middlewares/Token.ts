import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';
import UserRepository from '../repository/UserRepository';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

interface TokenPayload extends JwtPayload {
    email: string;
}

// Middleware para verificar o token JWT
class Token {
    public async authorize(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ message: 'No token provided' });
            }            const [scheme, token] = authHeader.split(' ');

            if (!/^Bearer$/i.test(scheme)) {
                return res.status(401).json({ message: 'Token malformatted' });
            }

            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET not configured');
            }

            const decoded = verify(token, process.env.JWT_SECRET) as TokenPayload;
            const email = decoded.email;
            const user = await UserRepository.findByEmail(email);
            
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            req.authMail = email;
            req.userId = user.id;

            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    }

    public async validate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        return this.authorize(req, res, next);
    }

    public async isAdmin(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const email = req.authMail;

            if (!email) {
                return res.status(401).json({ message: 'Usuário não autenticado' });
            }

            const user = await UserRepository.findByEmail(email);

            if (!user) {
                return res.status(401).json({ message: 'Usuário não encontrado' });
            }

            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
            }

            return next();
        } catch (error) {
            return res.status(500).json({ message: 'Erro ao verificar permissões de administrador' });
        }
    }
}

export default new Token();