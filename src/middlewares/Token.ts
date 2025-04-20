import { Request, Response, NextFunction } from 'express';
import { verify, JwtPayload } from 'jsonwebtoken';

interface TokenPayload extends JwtPayload {
    email: string;
}

class Token {
    public async authorize(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const [scheme, token] = authHeader.split(' ');

            if (!/^Bearer$/i.test(scheme)) {
                return res.status(401).json({ message: 'Token malformatted' });
            }

            const decoded = verify(token, process.env.JWT_SECRET) as TokenPayload;
            req.authMail = decoded.email;

            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    }
}

export default new Token();