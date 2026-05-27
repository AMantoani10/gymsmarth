/**
 * NotificationController.ts — Controller de Notificações do Admin
 *
 * Combina dois tipos de notificação em uma lista unificada e cronológica:
 * 1. Exames de IA: Alertas quando alunos enviam exames médicos
 * 2. Feedbacks de Treino: Comentários deixados pelos alunos ao finalizar sessões
 *
 * Endpoints:
 * - GET /api/admin/notifications         → Lista todas as notificações
 * - POST /api/admin/notifications/:id/dismiss → Exclui exame ou marca feedback como lido
 */
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { registrarLog } from '../services/LogService';

export class NotificationController {
  async listAll(req: Request, res: Response) {
    try {
      // 1. Get Exams
      const exams = await prisma.exameIA.findMany({
        where: { aluno: { admin_id: req.user!.id } },
        orderBy: { created_at: 'desc' },
        include: {
          aluno: { select: { id: true, nome: true, email: true } }
        }
      });

      // 2. Get Feedbacks (Logs with feedback_texto)
      const rawFeedbacks = await prisma.logTreino.findMany({
        where: { 
          // @ts-ignore
          feedback_lido: false,
          deleted_at: null,
          aluno: { admin_id: req.user!.id }
        },
        include: {
          aluno: { select: { id: true, nome: true, email: true } },
          sessao: { select: { id: true, treino_id: true, nome: true } }
        },
        orderBy: { created_at: 'desc' }
      });

      const feedbacks = rawFeedbacks.filter(fb => fb.feedback_texto && fb.feedback_texto.trim() !== "");

      // Format exams
      const formattedExams = exams.map(ex => ({
        id: ex.id,
        type: 'exam',
        aluno: ex.aluno,
        created_at: ex.created_at,
        analise_texto: ex.analise_texto,
        restricoes_geradas: ex.restricoes_geradas
      }));

      // Format feedbacks
      const formattedFeedbacks = feedbacks.map(fb => ({
        id: fb.id,
        type: 'feedback',
        aluno: fb.aluno,
        created_at: fb.created_at,
        feedback_texto: fb.feedback_texto,
        treino_id: fb.sessao?.treino_id,
        sessao_nome: fb.sessao?.nome
      }));

      const notifications = [...formattedExams, ...formattedFeedbacks].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return res.json(notifications);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  async dismiss(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type } = req.body;

      if (type === 'exam') {
        const exam = await prisma.exameIA.findUnique({ where: { id }, include: { aluno: { select: { nome: true, admin_id: true } } } });
        if (!exam || exam.aluno?.admin_id !== req.user!.id) return res.status(404).json({ error: "Exame não encontrado ou sem permissão" });

        await prisma.exameIA.delete({ where: { id } });
        registrarLog({ admin_id: req.user!.id, tipo: 'EXCLUIR', entidade: 'EXAME', entidade_id: id, descricao: `Excluiu alerta IA do aluno ${exam.aluno?.nome || 'desconhecido'}` });
        return res.json({ message: "Exame excluído com sucesso" });
      } else if (type === 'feedback') {
        const feedback = await prisma.logTreino.findUnique({ where: { id }, include: { aluno: { select: { admin_id: true } } } });
        if (!feedback || feedback.aluno?.admin_id !== req.user!.id) return res.status(404).json({ error: "Feedback não encontrado ou sem permissão" });

        // @ts-ignore
        await prisma.logTreino.update({
          where: { id },
          data: { feedback_lido: true }
        });
        return res.json({ message: "Feedback marcado como lido" });
      }

      return res.status(400).json({ error: "Tipo inválido" });
    } catch (error: any) {
      console.error("Erro ao fechar notificacao:", error);
      return res.status(500).json({ error: "Erro ao fechar notificacao" });
    }
  }
}
