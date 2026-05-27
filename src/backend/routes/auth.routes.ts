/**
 * auth.routes.ts — Rotas de Autenticação
 *
 * Rotas públicas (sem token):
 * - POST /api/auth/login          → Login
 * - POST /api/auth/register-admin → Criar admin
 * - POST /api/auth/forgot-password → Enviar código de recuperação
 * - POST /api/auth/reset-password  → Redefinir senha
 *
 * Rota protegida (requer token):
 * - PUT /api/auth/profile → Atualizar perfil (nome, email, senha)
 */
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/auth';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
const authController = new AuthController();

// Schema de validação para atualização de perfil
const UpdateProfileSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
});

// Rotas de Autenticação Aberta
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rota para criar Admin (Pode ser protegida ou pública no setup inicial)
router.post('/register-admin', authController.registerAdmin);

// Atualização de perfil — validado via Zod
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Não autorizado' });

    const data = UpdateProfileSchema.parse(req.body);
    
    const updateData: any = {};
    if (data.nome) updateData.nome = data.nome;
    if (data.email) {
      // Verifica se o e-mail já está em uso por outro usuário
      const existing = await prisma.user.findFirst({ 
        where: { email: data.email, id: { not: userId }, deleted_at: null } 
      });
      if (existing) return res.status(400).json({ error: 'E-mail já está em uso' });
      updateData.email = data.email;
    }
    if (data.senha) updateData.senha = await bcrypt.hash(data.senha, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, nome: true, email: true, role: true }
    });

    return res.json(user);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      const msgs = Array.isArray(error.errors) ? error.errors.map((e: any) => e.message).join(', ') : 'Erro de validação';
      return res.status(400).json({ error: msgs });
    }
    return res.status(400).json({ error: error.message || 'Erro ao atualizar perfil' });
  }
});

export default router;
