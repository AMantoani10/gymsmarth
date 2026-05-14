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
}
