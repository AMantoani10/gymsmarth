import { prisma } from '../lib/prisma';

type LogTipo = 'CRIAR' | 'EDITAR' | 'EXCLUIR';
type LogEntidade = 'ALUNO' | 'TREINO' | 'PLANO' | 'EXAME';

/**
 * Registra uma ação do admin no log de atividade.
 * Projetado para ser chamado de forma fire-and-forget (não bloqueia a resposta).
 */
export async function registrarLog(params: {
  admin_id: string;
  tipo: LogTipo;
  entidade: LogEntidade;
  entidade_id?: string;
  descricao: string;
}) {
  try {
    await prisma.logAtividade.create({
      data: {
        admin_id: params.admin_id,
        tipo: params.tipo,
        entidade: params.entidade,
        entidade_id: params.entidade_id || null,
        descricao: params.descricao,
      },
    });
  } catch (err) {
    // Log silencioso — não deve impedir a operação principal
    console.error('[LogService] Erro ao registrar log:', err);
  }
}
