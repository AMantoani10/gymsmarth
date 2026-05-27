import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { CreatePlanSchema } from '../schemas/admin.schema';
import { registrarLog } from '../services/LogService';
import { handleControllerError } from '../lib/errorHandler';

export class PlanController {
  async create(req: Request, res: Response) {
    try {
      const data = CreatePlanSchema.parse(req.body);
      const plan = await prisma.plano.create({ data: { ...data, admin_id: req.user!.id } });
      registrarLog({ admin_id: req.user!.id, tipo: 'CRIAR', entidade: 'PLANO', entidade_id: plan.id, descricao: `Criou o plano ${data.nome}` });
      return res.status(201).json(plan);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao criar plano');
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = CreatePlanSchema.parse(req.body);
      const { id } = req.params;

      const existingPlan = await prisma.plano.findFirst({ where: { id, admin_id: req.user!.id } });
      if (!existingPlan) return res.status(404).json({ error: 'Plano não encontrado ou sem permissão' });

      const plan = await prisma.plano.update({
        where: { id },
        data: { ...data }
      });
      registrarLog({ admin_id: req.user!.id, tipo: 'EDITAR', entidade: 'PLANO', entidade_id: id, descricao: `Editou o plano ${data.nome}` });
      return res.json(plan);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao atualizar plano');
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingPlan = await prisma.plano.findFirst({ where: { id, admin_id: req.user!.id } });
      if (!existingPlan) return res.status(404).json({ error: 'Plano não encontrado ou sem permissão' });

      const alunosAtivosNoPlano = await prisma.matricula.count({
        where: {
          plano_id: id,
          user: { deleted_at: null }
        }
      });

      if (alunosAtivosNoPlano > 0) {
        return res.status(400).json({ error: 'Não é possível excluir um plano que possui alunos matriculados ativos. Exclua ou altere os alunos primeiro.' });
      }

      await prisma.plano.update({
        where: { id },
        data: { deleted_at: new Date() }
      });
      registrarLog({ admin_id: req.user!.id, tipo: 'EXCLUIR', entidade: 'PLANO', entidade_id: id, descricao: `Excluiu um plano` });
      return res.status(204).send();
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao excluir plano');
    }
  }

  async list(req: Request, res: Response) {
    try {
      const plans = await prisma.plano.findMany({
        where: { deleted_at: null, admin_id: req.user!.id },
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { 
              matriculas: {
                where: {
                  deleted_at: null,
                  data_vencimento: { gte: new Date() },
                  user: { deleted_at: null }
                }
              }
            }
          }
        }
      });
      return res.json(plans);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao listar planos');
    }
  }
}
