/**
 * StudentRepository.ts — Repositório de Alunos
 *
 * Encapsula queries Prisma específicas para alunos (role = 'ALUNO').
 * Diferente do UserRepository, este inclui dados de matrícula e treinos.
 *
 * Métodos:
 * - create: Cria um aluno (força role='ALUNO')
 * - listAll: Lista todos os alunos de um admin, com matrículas e treinos incluídos
 * - findById: Busca um aluno por ID com todos os relacionamentos
 *
 * Segurança: A senha é removida do retorno para nunca expor ao frontend.
 */
import { prisma } from "../lib/prisma";
import { Prisma, User } from "@prisma/client";

export class StudentRepository {
  async create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({ data: { ...data, role: 'ALUNO' } });
  }

  async listAll(admin_id: string) {
    const students = await prisma.user.findMany({ 
      where: { role: 'ALUNO', deleted_at: null, admin_id },
      include: { 
        matriculas: {
          include: { plano: true },
          orderBy: { created_at: 'desc' }
        },
        treinos_recebidos: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return students.map(student => {
      const { senha, ...rest } = student;
      return rest;
    });
  }

  async findById(id: string, admin_id: string) {
    const student = await prisma.user.findFirst({
      where: { id, admin_id },
      include: {
        matriculas: { include: { plano: true }, orderBy: { created_at: 'desc' } },
        treinos_recebidos: { where: { deleted_at: null }, orderBy: { created_at: 'desc' } },
        exames: true
      }
    });

    if (!student) return null;

    const { senha, ...rest } = student;
    return rest;
  }
}
