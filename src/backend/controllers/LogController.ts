/**
 * LogController.ts — Controller de Logs de Atividade
 *
 * Endpoint:
 * - GET /api/admin/logs?dias=7 → Lista as últimas atividades do admin
 *
 * Retorna no máximo 50 logs dentro do período especificado.
 * Usado no painel "Atividade Recente" do dashboard admin.
 */
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class LogController {
  async list(req: Request, res: Response) {
    try {
      const { dias } = req.query;
      const daysFilter = dias ? parseInt(dias as string, 10) : 7;

      const since = new Date();
      since.setDate(since.getDate() - daysFilter);

      const logs = await prisma.logAtividade.findMany({
        where: {
          created_at: { gte: since },
          admin_id: req.user!.id
        },
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
          admin: { select: { id: true, nome: true } },
        },
      });

      return res.json(logs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao buscar logs' });
    }
  }
}
