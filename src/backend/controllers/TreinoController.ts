import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { registrarLog } from '../services/LogService';
import { handleControllerError } from '../lib/errorHandler';

const CreateTreinoSchema = z.object({
  nome: z.string().min(3, 'Nome do treino deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional().nullable(),
  objetivo: z.string().optional().nullable(),
  aluno_id: z.string().uuid('ID do aluno inválido'),
  data_inicio: z.string().optional().nullable().transform(v => v === "" ? null : v),
  data_fim: z.string().optional().nullable().transform(v => v === "" ? null : v),
  sessoes: z.array(z.object({
    id: z.string().optional().nullable(), // For update
    nome: z.string().optional().nullable(),
    dia_preferencial: z.number().int().min(0).max(6).optional().nullable(),
    ordem_sequencial: z.number().int().positive(),
    lista_exercicios: z.string() // Frontend envia como JSON stringificado
  }))
});

/**
 * Converte lista_exercicios de String para JSON para persistir no PostgreSQL
 */
function parseExercicios(lista: string): any {
  try {
    return JSON.parse(lista);
  } catch {
    return [];
  }
}

export class TreinoController {
  async getExercicios(req: Request, res: Response) {
    try {
      const exercicios = await prisma.exercicio.findMany({
        orderBy: { nome: 'asc' }
      });
      return res.json(exercicios);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao buscar exercícios');
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = CreateTreinoSchema.parse(req.body);
      const admin_id = req.user?.id;
      
      if (!admin_id) return res.status(401).json({ error: 'Não autorizado' });

      // Salva novos exercícios globalmente no catálogo
      for (const s of data.sessoes) {
        const exerciciosList = parseExercicios(s.lista_exercicios);
        for (const ex of exerciciosList) {
          if (ex.nome) {
            await prisma.exercicio.upsert({
              where: { nome: ex.nome },
              update: {},
              create: { nome: ex.nome }
            }).catch(() => {}); // ignora erros de race condition
          }
        }
      }

      const treino = await prisma.treino.create({
        data: {
          admin_id,
          aluno_id: data.aluno_id,
          nome: data.nome,
          descricao: data.descricao,
          objetivo: data.objetivo,
          data_inicio: data.data_inicio ? new Date(data.data_inicio) : null,
          data_fim: data.data_fim ? new Date(data.data_fim) : null,
          sessoes: {
            create: data.sessoes.map(s => ({
              nome: s.nome,
              dia_preferencial: s.dia_preferencial,
              ordem_sequencial: s.ordem_sequencial,
              lista_exercicios: parseExercicios(s.lista_exercicios) // Json nativo PostgreSQL
            }))
          }
        },
        include: { sessoes: true }
      });

      registrarLog({ admin_id, tipo: 'CRIAR', entidade: 'TREINO', entidade_id: treino.id, descricao: `Criou o treino "${data.nome}"` });
      return res.status(201).json(treino);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao criar treino');
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = CreateTreinoSchema.parse(req.body);
      const admin_id = req.user?.id;
      
      if (!admin_id) return res.status(401).json({ error: 'Não autorizado' });

      // Salva novos exercícios globalmente no catálogo
      for (const s of data.sessoes) {
        const exerciciosList = parseExercicios(s.lista_exercicios);
        for (const ex of exerciciosList) {
          if (ex.nome) {
            await prisma.exercicio.upsert({
              where: { nome: ex.nome },
              update: {},
              create: { nome: ex.nome }
            }).catch(() => {});
          }
        }
      }

      await prisma.treino.update({
        where: { id },
        data: {
          aluno_id: data.aluno_id,
          nome: data.nome,
          descricao: data.descricao,
          objetivo: data.objetivo,
          data_inicio: data.data_inicio ? new Date(data.data_inicio) : null,
          data_fim: data.data_fim ? new Date(data.data_fim) : null,
        }
      });
      
      const existingSessoes = await prisma.sessaoTreino.findMany({ where: { treino_id: id } });
      const idsToKeep = data.sessoes.map(s => s.id).filter(Boolean);
      
      for (const es of existingSessoes) {
         if (!idsToKeep.includes(es.id)) {
            await prisma.sessaoTreino.update({ where: { id: es.id }, data: { deleted_at: new Date() } });
         }
      }

      for (const s of data.sessoes) {
         if (s.id) {
           await prisma.sessaoTreino.update({
             where: { id: s.id },
             data: {
               nome: s.nome,
               dia_preferencial: s.dia_preferencial,
               ordem_sequencial: s.ordem_sequencial,
               lista_exercicios: parseExercicios(s.lista_exercicios) // Json nativo PostgreSQL
             }
           });
         } else {
           await prisma.sessaoTreino.create({
             data: {
               treino_id: id,
               nome: s.nome,
               dia_preferencial: s.dia_preferencial,
               ordem_sequencial: s.ordem_sequencial,
               lista_exercicios: parseExercicios(s.lista_exercicios) // Json nativo PostgreSQL
             }
           });
         }
      }

      const treino = await prisma.treino.findUnique({
        where: { id },
        include: { sessoes: { where: { deleted_at: null } } }
      });

      registrarLog({ admin_id, tipo: 'EDITAR', entidade: 'TREINO', entidade_id: id, descricao: `Editou o treino "${data.nome}"` });
      return res.json(treino);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao atualizar treino');
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.treino.update({
        where: { id },
        data: { deleted_at: new Date() }
      });
      registrarLog({ admin_id: req.user!.id, tipo: 'EXCLUIR', entidade: 'TREINO', entidade_id: id, descricao: `Excluiu um treino` });
      return res.status(204).send();
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao excluir treino');
    }
  }

  async listAdmin(req: Request, res: Response) {
    try {
      const treinos = await prisma.treino.findMany({
        where: { admin_id: req.user?.id, deleted_at: null },
        orderBy: { created_at: 'desc' },
        include: { 
          sessoes: {
            where: { deleted_at: null }
          },
          aluno: { select: { id: true, nome: true } }
        }
      });
      return res.json(treinos);
    } catch (error: any) {
      return handleControllerError(res, error, 'Erro ao listar treinos');
    }
  }
}
