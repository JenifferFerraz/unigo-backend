import { User } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      authMail?: string;
      user?: User;
    }
  }
}

export {};