import { Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { handleControllerError } from '../lib/errorHandler';

const aiService = new AIService();

const GenerateWorkoutSchema = z.object({
  student_id: z.string().uuid("ID do aluno inválido"),
  goal: z.string().min(5, "Descreva o objetivo do aluno (ex: Emagrecimento, Ganho de Massa)")
});

export class WorkoutController {
  /**
   * Sugestão de Treino Inteligente via IA (OpenRouter)
   * O Admin solicita e a IA gera baseada no perfil do aluno
   */
  async suggestSmartWorkout(req: Request, res: Response) {
    try {
      const { student_id, goal } = GenerateWorkoutSchema.parse(req.body);

      // 1. Busca dados do aluno e exames
      const student = await prisma.user.findUnique({
        where: { id: student_id },
        include: { exames: { orderBy: { created_at: 'desc' }, take: 1 } }
      });

      if (!student) return res.status(404).json({ error: "Aluno não encontrado" });

      const lastExam = student.exames[0];
      const restrictions = lastExam ? lastExam.restricoes_geradas : "Nenhuma restrição cadastrada. Treino padrão liberado.";

      // 2. Chama a IA para gerar a sugestão
      const smartWorkout = await aiService.generateWorkoutPlan(student.nome, restrictions, goal);

      return res.json({
        message: "Sugestão de treino gerada com sucesso pela IA",
        workout: smartWorkout
      });

    } catch (error: any) {
      return handleControllerError(res, error, "Erro ao gerar sugestão de treino");
    }
  }
}
