import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import TokenNode from '../middlewares/Token';

const authRoutes = Router();

authRoutes.post('/login', AuthController.login.bind(AuthController));
authRoutes.get('/me', TokenNode.authorize.bind(TokenNode), AuthController.me.bind(AuthController));
authRoutes.post('/forgot-password', AuthController.requestPasswordReset.bind(AuthController));
authRoutes.post('/reset-password', AuthController.resetPassword.bind(AuthController));
authRoutes.post('/accept-terms', TokenNode.authorize.bind(TokenNode), AuthController.acceptTerms.bind(AuthController));

export { authRoutes };