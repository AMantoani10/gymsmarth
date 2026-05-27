/**
 * AuthController.ts — Controller de Autenticação
 *
 * Gerencia os endpoints de autenticação (rotas públicas, sem token):
 * - POST /api/auth/login          → Faz login e retorna token JWT
 * - POST /api/auth/register-admin → Cria conta de administrador
 * - POST /api/auth/forgot-password → Envia código de recuperação por e-mail
 * - POST /api/auth/reset-password  → Redefine senha com código
 *
 * Delega a lógica de negócios para o AuthService.
 * Usa schemas Zod para validação de entrada.
 */
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { LoginSchema, RegisterAdminSchema, ForgotPasswordSchema } from '../schemas/auth.schema';
import { handleControllerError } from '../lib/errorHandler';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data);
      return res.json(result);
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return handleControllerError(res, error);
      }
      return res.status(401).json({ error: error.message || 'Erro de login' });
    }
  }

  async registerAdmin(req: Request, res: Response) {
    try {
      const data = RegisterAdminSchema.parse(req.body);
      const user = await authService.registerAdmin(data);
      return res.status(201).json(user);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro de registro');
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = ForgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(email);
      return res.json(result);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro na recuperação de senha');
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      // Usando uma validação manual simples aqui, mas poderia ser adicionado ao auth.schema.ts
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Dados inválidos. A senha deve ter no mínimo 6 caracteres.' });
      }
      const result = await authService.resetPassword(email, code, newPassword);
      return res.json(result);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao redefinir a senha');
    }
  }
}
