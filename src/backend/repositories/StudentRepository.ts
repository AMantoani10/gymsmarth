import { prisma } from "../lib/prisma";
import { Prisma, User } from "@prisma/client";

export class StudentRepository {
  async create(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({ data: { ...data, role: 'ALUNO' } });
  }

  async listAll() {
    const students = await prisma.user.findMany({ 
      where: { role: 'ALUNO', deleted_at: null },
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

  async findById(id: string) {
    const student = await prisma.user.findUnique({
      where: { id },
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
