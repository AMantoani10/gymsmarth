import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserRepository } from '../repositories/UserRepository';
import { LoginSchema, RegisterAdminSchema } from '../schemas/auth.schema';
import { z } from 'zod';
import { EmailService } from './EmailService';

const userRepository = new UserRepository();
const emailService = new EmailService();

export class AuthService {
  /**
   * Realiza o login do usuário
   * 1. Busca usuário por e-mail
   * 2. Compara Hash da senha com BCrypt
   * 3. Gera JWT contendo ID e Role
   */
  async login(credentials: z.infer<typeof LoginSchema>) {
    const user = await userRepository.findByEmail(credentials.email);

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(credentials.senha, user.senha);
    if (!passwordMatch) {
      throw new Error('Credenciais inválidas');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado no ambiente');
    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Registro do Admin
   * Responsável por criar usuários com privilégios administrativos
   */
  async registerAdmin(data: z.infer<typeof RegisterAdminSchema>) {
    const userExists = await userRepository.findByEmail(data.email);
    if (userExists) {
      throw new Error('Usuário já cadastrado');
    }

    const hashedSearch = await bcrypt.hash(data.senha, 10);

    const user = await userRepository.create({
      nome: data.nome,
      email: data.email,
      senha: hashedSearch,
      role: 'ADMIN',
    });

    // Enviar e-mail de boas-vindas
    await emailService.sendWelcomeEmail(user.email, user.nome);

    return user;
  }

  /**
   * Recuperação de Senha
   * Gera um código e envia por e-mail, salvando no banco.
   */
  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expira em 15 minutos

    await prisma.user.update({
      where: { id: user.id },
      data: {
        recovery_code: recoveryCode,
        recovery_code_expires: expiresAt
      }
    });
    
    await emailService.sendPasswordRecoveryEmail(user.email, recoveryCode);
    
    return { message: 'Código enviado com sucesso para o e-mail.' };
  }

  /**
   * Redefinir Senha
   * Valida o código e atualiza a senha.
   */
  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (!user.recovery_code || user.recovery_code !== code) {
      throw new Error('Código de recuperação inválido');
    }

    if (!user.recovery_code_expires || user.recovery_code_expires < new Date()) {
      throw new Error('O código de recuperação expirou. Solicite um novo.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        senha: hashedPassword,
        recovery_code: null,
        recovery_code_expires: null
      }
    });

    return { message: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
  }
}
