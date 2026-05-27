/**
 * ExamController.ts — Controller de Exames Médicos
 *
 * Gerencia o envio e análise de exames médicos pela IA:
 * - POST /api/exams/analyze  → Aluno envia exame; IA analisa e extrai restrições
 * - GET /api/exams/my-exams  → Aluno lista seus próprios exames
 * - GET /api/admin/exams     → Admin lista exames dos seus alunos
 * - DELETE /api/admin/exams/:id → Admin exclui um exame
 *
 * O texto/imagem do exame é enviado para o AIService (OpenRouter),
 * que retorna diagnósticos, restrições de movimento e nível de alerta.
 * O resultado completo é salvo no banco em campos JSON (PostgreSQL).
 */
import { Request, Response } from 'express';
import { AIService } from '../services/AIService';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { registrarLog } from '../services/LogService';
import { handleControllerError } from '../lib/errorHandler';

const aiService = new AIService();

const AnalyzeExamSchema = z.object({
  examText: z.string().optional().default(""),
  url_anexo: z.string().url().optional(),
  fileData: z.string().optional(),
  fileMimeType: z.string().optional()
}).refine(data => data.examText?.trim() || data.fileData, {
  message: "É necessário descrever o exame ou enviar um anexo"
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
      console.error("Erro na análise de IA:", error?.message || error);
      
      // Erros específicos da API de IA (401, 402, 429)
      if (error?.status === 401) {
        return res.status(503).json({ 
          error: "Chave da API de IA inválida ou expirada. Contate o administrador do sistema."
        });
      }
      if (error?.status === 402) {
        return res.status(503).json({ 
          error: "Créditos de IA esgotados. Contate o administrador do sistema."
        });
      }
      if (error?.status === 429) {
        return res.status(429).json({ 
          error: "Limite de uso da IA atingido. Aguarde alguns minutos e tente novamente."
        });
      }

      // Erro de validação Zod
      if (error?.name === 'ZodError') {
        return handleControllerError(res, error);
      }

      // Erro genérico
      return res.status(500).json({ 
        error: error?.message || "Falha ao processar exame com IA. Tente novamente."
      });
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
        where: {
          aluno: { admin_id: req.user!.id }
        },
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
      const exam = await prisma.exameIA.findUnique({ where: { id }, include: { aluno: { select: { nome: true, admin_id: true } } } });
      
      if (!exam || exam.aluno?.admin_id !== req.user!.id) return res.status(404).json({ error: "Exame não encontrado ou sem permissão" });

      await prisma.exameIA.delete({ where: { id } });
      registrarLog({ admin_id: req.user!.id, tipo: 'EXCLUIR', entidade: 'EXAME', entidade_id: id, descricao: `Excluiu alerta IA do aluno ${exam?.aluno?.nome || 'desconhecido'}` });
      return res.json({ message: "Exame excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir exame:", error);
      return res.status(500).json({ error: "Erro ao excluir exame" });
    }
  }
}
