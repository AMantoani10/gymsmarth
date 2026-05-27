/**
 * UserRepository.ts — Repositório de Usuários genérico
 *
 * Encapsula queries Prisma para operações básicas com usuários.
 * Usado principalmente pelo AuthService para login e registro.
 *
 * Métodos:
 * - create: Cria um novo usuário no banco
 * - findByEmail: Busca usuário por email (ignora deletados)
 * - findById: Busca usuário por ID (ignora deletados)
 */
import { prisma } from "../lib/prisma";
import { Prisma, User } from "@prisma/client";

export class UserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, deleted_at: null } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deleted_at: null } });
  }
}
