import { Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { registrarLog } from '../services/LogService';
import { handleControllerError } from '../lib/errorHandler';

const aiService = new AIService();

const AnalyzeExamSchema = z.object({
  examText: z.string().min(10, 'O texto do exame deve ter pelo menos 10 caracteres'),
  url_anexo: z.string().url().optional(),
  fileData: z.string().optional(),
  fileMimeType: z.string().optional()
});

export class ExamController {
  async analyze(req: Request, res: Response) {
    try {
      const student_id = req.user?.id;
      if (!student_id) return res.status(401).json({ error: "Não autorizado" });

      const { examText, url_anexo, fileData, fileMimeType } = AnalyzeExamSchema.parse(req.body);

      // Chamada para a IA (OpenRouter)
      const analysis = await aiService.analyzeMedicalExam(examText, fileData, fileMimeType);

      // Monta o resumo clínico a partir dos campos da resposta da IA
      const resumoClinico = {
        diagnosticos: analysis.diagnosticos_detectados || [],
        sugestao: analysis.sugestao_ajuste_treino || "",
        nivel_alerta: analysis.nivel_alerta || "baixo"
      };

      // Salva no Banco de Dados (campos Json no PostgreSQL)
      const savedExam = await prisma.exameIA.create({
        data: {
          aluno_id: student_id,
          url_anexo: url_anexo || "upload_manual",
          analise_texto: resumoClinico,
          restricoes_geradas: analysis // Salva o JSON completo da análise
        }
      });

      return res.json({
        message: "Análise concluída com sucesso by Gym Smarth AI",
        data: savedExam,
        smart_analysis: analysis
      });

    } catch (error: any) {
      console.error("Erro na análise de IA:", error);
      
      // Verifica erros de quota/rate limit da API
      const isQuotaError = error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError) {
        return res.status(429).json({ 
          error: "Limite de uso da IA atingido. Aguarde alguns minutos e tente novamente."
        });
      }

      return handleControllerError(res, error, "Falha ao processar exame com IA");
    }
  }

  async getMyExams(req: Request, res: Response) {
    try {
      const student_id = req.user?.id;
      if (!student_id) return res.status(401).json({ error: "Não autorizado" });

      const exams = await prisma.exameIA.findMany({
        where: { aluno_id: student_id },
        orderBy: { created_at: 'desc' }
      });
      return res.json(exams);
    } catch (error: any) {
      return handleControllerError(res, error, "Erro ao buscar exames");
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      const exams = await prisma.exameIA.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          aluno: { select: { id: true, nome: true, email: true } }
        }
      });
      return res.json(exams);
    } catch (error: any) {
      return handleControllerError(res, error, "Erro ao listar exames");
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exam = await prisma.exameIA.findUnique({ where: { id }, include: { aluno: { select: { nome: true } } } });
      
      if (!exam) return res.status(404).json({ error: "Exame não encontrado" });

      await prisma.exameIA.delete({ where: { id } });
      registrarLog({ admin_id: req.user!.id, tipo: 'EXCLUIR', entidade: 'EXAME', entidade_id: id, descricao: `Excluiu alerta IA do aluno ${exam?.aluno?.nome || 'desconhecido'}` });
      return res.json({ message: "Exame excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir exame:", error);
      return res.status(500).json({ error: "Erro ao excluir exame" });
    }
  }
}
