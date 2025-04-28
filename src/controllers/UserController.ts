import { Request, Response } from 'express';
import UserService from '../services/UserService';

class UserController {
  //** Cria um novo usuário
  public async createUser(req: Request, res: Response): Promise<Response> {
    try {
      UserService.validateCreateUser(req);
      const user = await UserService.create(req.body);
      return res.status(201).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default new UserController();
