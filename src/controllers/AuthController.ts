import { Request, Response } from "express";
import AuthService from "../services/AuthService";

//     * Realiza o login do usuário
class AuthController {
  public static async login(req: Request, res: Response): Promise<Response> {
    try {
      // Valida os dados de login
      AuthService.validateLogin(req);
      const auth = await AuthService.login(req.body);

      // Verifica se o usuário aceitou os termos
      if (!auth.termsAccepted) {
        return res.status(202).json({
          ...auth,
          message: "Please accept the terms and conditions to continue",
        });
      }

      return res.status(200).json(auth);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  //     * Retorna os dados do perfil do usuário atual
  public static async me(req: Request, res: Response): Promise<Response> {
    try {
      const user = await AuthService.getProfile(req.body.email);
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  //     * Inicia o processo de redefinição de senha
  public static async requestPasswordReset(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      AuthService.validatePasswordReset(req);
      const result = await AuthService.requestPasswordReset(req.body.email);
      
      if (result === false) {
        return res.status(404).json({
          message: "Este email não está cadastrado no sistema.",
        });
      }
      
      return res.status(200).json({
        message:
          "Email enviado com sucesso! Verifique sua caixa de entrada e também a pasta de spam.",
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  //     * Completa o processo de redefinição de senha
  public static async resetPassword(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        throw new Error("Token e nova senha são obrigatórios");
      }
      await AuthService.resetPassword(token, newPassword);
      return res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  //     * Registra a aceitação dos termos pelo usuário
  public static async acceptTerms(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      await AuthService.acceptTerms(req.body.userId);
      return res.status(200).json({
        message: "Termos aceitos com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default AuthController;
