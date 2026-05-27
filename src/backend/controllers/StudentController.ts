/**
 * StudentController.ts — Controller de Alunos
 *
 * CRUD completo de alunos + renovação de matrícula:
 * - POST /api/admin/students         → Cria aluno + matrícula (transação atômica)
 * - GET /api/admin/students          → Lista alunos do admin
 * - PUT /api/admin/students/:id      → Atualiza dados do aluno
 * - DELETE /api/admin/students/:id   → Soft delete (libera e-mail para reuso)
 * - POST /api/admin/students/:id/renew → Renova matrícula baseada no plano atual
 *
 * A criação usa $transaction do Prisma para garantir que o aluno
 * e a matrícula sejam criados juntos ou nenhum dos dois.
 */
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { StudentRepository } from '../repositories/StudentRepository';
import { CreateStudentSchema } from '../schemas/admin.schema';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { registrarLog } from '../services/LogService';
import { handleControllerError } from '../lib/errorHandler';
import { EmailService } from '../services/EmailService';

const studentRepository = new StudentRepository();
const emailService = new EmailService();

const UpdateStudentSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
});

export class StudentController {
  async create(req: Request, res: Response) {
    try {
      const data = CreateStudentSchema.parse(req.body);
      
      const userExists = await prisma.user.findUnique({ where: { email: data.email } });
      if (userExists) return res.status(400).json({ error: 'E-mail em uso' });

      const hashedPassword = await bcrypt.hash(data.senha, 10);

      const student = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            nome: data.nome,
            email: data.email,
            senha: hashedPassword,
            role: 'ALUNO',
            matricula_ativa: true,
            admin_id: req.user!.id
          }
        });

        const plano = await tx.plano.findFirst({ 
          where: { 
            id: data.plano_id,
            admin_id: req.user!.id
          } 
        });
        if (!plano) throw new Error('Plano não encontrado ou sem permissão');

        const dataInicio = data.data_inicio ? new Date(data.data_inicio) : new Date();
        let dataVencimento: Date;
        if (data.data_fim) {
          dataVencimento = new Date(data.data_fim);
        } else {
          dataVencimento = new Date(dataInicio);
          dataVencimento.setDate(dataVencimento.getDate() + plano.duracao_dias);
        }

        await tx.matricula.create({
          data: {
            user_id: newUser.id,
            plano_id: plano.id,
            data_inicio: dataInicio,
            data_vencimento: dataVencimento,
            status_pagamento: true // Assume pago na criação para demo
          }
        });

        return newUser;
      });

      // Send welcome email asynchronously
      emailService.sendWelcomeEmail(student.email, student.nome).catch(console.error);

      registrarLog({ admin_id: req.user!.id, tipo: 'CRIAR', entidade: 'ALUNO', entidade_id: student.id, descricao: `Cadastrou o aluno ${data.nome}` });
      return res.status(201).json(student);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro no cadastro');
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = UpdateStudentSchema.parse(req.body);
      
      const updateData: any = { ...data };
      if (data.senha) {
        updateData.senha = await bcrypt.hash(data.senha, 10);
      }

      const user = await prisma.user.findFirst({ where: { id, role: 'ALUNO', admin_id: req.user!.id } });
      if (!user) return res.status(404).json({ error: 'Aluno não encontrado' });

      const student = await prisma.user.update({
        where: { id },
        data: updateData
      });

      registrarLog({ admin_id: req.user!.id, tipo: 'EDITAR', entidade: 'ALUNO', entidade_id: id, descricao: `Editou o aluno ${student.nome}` });
      return res.json({ id: student.id, nome: student.nome, email: student.email });
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao atualizar aluno');
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const user = await prisma.user.findFirst({ where: { id, role: 'ALUNO', deleted_at: null, admin_id: req.user!.id } });
      if (!user) return res.status(404).json({ error: 'Aluno não encontrado' });

      // Soft delete para manter consistência e liberar o e-mail para novo cadastro
      await prisma.user.update({
        where: { id },
        data: { 
          deleted_at: new Date(), 
          matricula_ativa: false,
          email: `${user.email}_deleted_${Date.now()}`
        }
      });
      
      registrarLog({ admin_id: req.user!.id, tipo: 'EXCLUIR', entidade: 'ALUNO', entidade_id: id, descricao: `Excluiu o aluno ${user.nome}` });
      return res.status(204).send();
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao excluir aluno');
    }
  }

  async list(req: Request, res: Response) {
    try {
      const students = await studentRepository.listAll(req.user!.id);
      return res.json(students);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao listar alunos');
    }
  }

  async renew(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const user = await prisma.user.findFirst({ 
        where: { id, role: 'ALUNO', deleted_at: null, admin_id: req.user!.id },
        include: { matriculas: { include: { plano: true }, orderBy: { data_vencimento: 'desc' }, take: 1 } }
      });
      if (!user) return res.status(404).json({ error: 'Aluno não encontrado' });

      if (!user.matriculas || user.matriculas.length === 0) {
        return res.status(400).json({ error: 'Aluno não possui plano para renovar' });
      }

      const lastMatricula = user.matriculas[0];
      const plano = lastMatricula.plano;

      const hoje = new Date();
      // Se ainda não venceu, adiciona a partir do vencimento. Senão, a partir de hoje.
      const novaDataInicio = lastMatricula.data_vencimento > hoje ? new Date(lastMatricula.data_vencimento) : hoje;
      const novaDataVencimento = new Date(novaDataInicio);
      novaDataVencimento.setDate(novaDataVencimento.getDate() + plano.duracao_dias);

      const novaMatricula = await prisma.$transaction(async (tx) => {
        const mat = await tx.matricula.create({
          data: {
            user_id: user.id,
            plano_id: plano.id,
            data_inicio: novaDataInicio,
            data_vencimento: novaDataVencimento,
            status_pagamento: true
          }
        });

        await tx.user.update({
          where: { id: user.id },
          data: { matricula_ativa: true }
        });

        return mat;
      });

      registrarLog({ admin_id: req.user!.id, tipo: 'EDITAR', entidade: 'ALUNO', entidade_id: id, descricao: `Renovou o plano do aluno ${user.nome}` });
      return res.json(novaMatricula);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao renovar plano');
    }
  }
}
