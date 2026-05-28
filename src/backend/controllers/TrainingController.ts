/**
 * TrainingController.ts — Controller de Treino do Aluno
 *
 * Endpoints usados pelo aluno para acessar e executar seus treinos:
 * - GET /api/training/next          → Retorna a próxima sessão de treino (rotação automática)
 * - GET /api/training/all           → Retorna o treino ativo com todas as sessões
 * - POST /api/training/log          → Registra conclusão de sessão com feedback
 * - POST /api/training/carga        → Salva carga de um exercício no histórico
 * - GET /api/training/carga/:exercicio → Retorna histórico de cargas por exercício
 *
 * A rotação de sessões funciona assim: encontra a última sessão concluída
 * e avança para a próxima (volta ao início ao completar todas).
 *
 * Verifica matrícula ativa antes de liberar acesso aos treinos.
 */
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

export class TrainingController {
  async getNextTrainingSession(req: Request, res: Response) {
    try {
      const student_id = req.user?.id;
      if (!student_id) return res.status(401).json({ error: "Não autorizado" });

      const matricula = await prisma.matricula.findFirst({
        where: { user_id: student_id },
        orderBy: { created_at: 'desc' }
      });

      if (!matricula || !matricula.status_pagamento || matricula.data_vencimento < new Date()) {
        return res.status(403).json({ error: "Matrícula inativa ou expirada.", paywall: true });
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Find active Treino
      const treinoAtivo = await prisma.treino.findFirst({
        where: {
          aluno_id: student_id,
          data_inicio: { lte: today },
          OR: [
             { data_fim: null },
             { data_fim: { gte: new Date() } }
          ],
          deleted_at: null
        },
        include: { sessoes: { orderBy: { ordem_sequencial: 'asc' } } }
      });

      if (!treinoAtivo || treinoAtivo.sessoes.length === 0) {
        return res.status(404).json({ error: "Nenhum treino ativo encontrado." });
      }

      const lastLog = await prisma.logTreino.findFirst({
        where: { aluno_id: student_id, sessao: { treino_id: treinoAtivo.id } },
        orderBy: { data_conclusao: 'desc' },
        include: { sessao: true }
      });

      let nextIndex = 0;
      if (lastLog) {
        const lastIndex = treinoAtivo.sessoes.findIndex(s => s.id === lastLog.sessao_id);
        if (lastIndex !== -1 && lastIndex < treinoAtivo.sessoes.length - 1) {
           nextIndex = lastIndex + 1;
        } else {
           nextIndex = 0; // loops back
        }
      }

      const sessaoAtual = treinoAtivo.sessoes[nextIndex];

      return res.status(200).json({
        ...sessaoAtual,
        treino: {
           nome: treinoAtivo.nome,
           objetivo: treinoAtivo.objetivo
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Erro interno.", details: error.message });
    }
  }

  async logSession(req: Request, res: Response) {
    try {
      const { sessao_id, observacao } = req.body;
      const student_id = req.user?.id;
      if (!student_id) return res.status(401).json({ error: "Não autorizado" });

      const log = await prisma.logTreino.create({
        data: {
          aluno_id: student_id,
          sessao_id,
          feedback_texto: observacao
        }
      });
      return res.status(201).json(log);
    } catch(err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAllTrainingSessions(req: Request, res: Response) {
    try {
      const student_id = req.user?.id;
      console.log(`[TrainingController] getAllTrainingSessions called! User: ${student_id}, User-Agent: ${req.headers['user-agent']}`);
      
      if (!student_id) {
         console.log(`[TrainingController] Unauthorized - No student_id`);
         return res.status(401).json({ error: "Não autorizado" });
      }

      const matricula = await prisma.matricula.findFirst({
        where: { user_id: student_id },
        orderBy: { created_at: 'desc' }
      });

      if (!matricula || !matricula.status_pagamento || matricula.data_vencimento < new Date()) {
        return res.status(403).json({ error: "Matrícula inativa ou expirada.", paywall: true });
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const treinoAtivo = await prisma.treino.findFirst({
        where: {
          aluno_id: student_id,
          data_inicio: { lte: today },
          OR: [
             { data_fim: null },
             { data_fim: { gte: new Date() } }
          ],
          deleted_at: null
        },
        include: { sessoes: { orderBy: { ordem_sequencial: 'asc' } } }
      });

      if (!treinoAtivo || treinoAtivo.sessoes.length === 0) {
        console.log(`[TrainingController] 404 - Nenhum treino encontrado para o aluno ${student_id}`);
        return res.status(404).json({ error: "Nenhum treino ativo encontrado." });
      }

      console.log(`[TrainingController] 200 - Retornando treino ${treinoAtivo.id} com ${treinoAtivo.sessoes.length} sessões para o aluno ${student_id}`);
      return res.status(200).json(treinoAtivo);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro interno.", details: error.message });
    }
  }

  async saveCarga(req: Request, res: Response) {
    try {
      const { exercicio, carga } = req.body;
      const student_id = req.user?.id;
      if (!student_id) return res.status(401).json({ error: "Não autorizado" });
      
      const id = crypto.randomUUID();
      
      await prisma.$executeRaw`INSERT INTO historico_cargas (id, aluno_id, exercicio, carga, created_at) VALUES (${id}, ${student_id}, ${exercicio}, ${carga}, NOW())`;

      return res.status(201).json({ message: "Carga salva com sucesso" });
    } catch(err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getHistoricoCarga(req: Request, res: Response) {
    try {
      const { exercicio } = req.params;
      const student_id = req.user?.id;
      if (!student_id) return res.status(401).json({ error: "Não autorizado" });

      const historico = await prisma.$queryRaw`SELECT * FROM historico_cargas WHERE aluno_id = ${student_id} AND exercicio = ${exercicio} ORDER BY created_at DESC`;
      
      return res.status(200).json(historico);
    } catch(err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

