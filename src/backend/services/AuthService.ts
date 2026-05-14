import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserRepository } from '../repositories/UserRepository';
import { LoginSchema, RegisterAdminSchema } from '../schemas/auth.schema';
import { z } from 'zod';

const userRepository = new UserRepository();

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

    return user;
  }

  /**
   * Recuperação de Senha (Simulação)
   * Gera um código e salva em cache/DB (simulado por enquanto)
   */
  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log(`[AUTH] Código de recuperação para ${email}: ${recoveryCode}`);
    
    // Aqui no futuro salvaríamos no Redis ou Tabela de recuperação com expiração
    return { message: 'Código enviado com sucesso (Cheque o console)' };
  }
}
