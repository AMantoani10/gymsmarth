/**
 * errorHandler.ts — Tratamento centralizado de erros em Controllers
 *
 * Fornece a função handleControllerError() usada por todos os controllers.
 * Trata erros de validação Zod (retorna 400 com mensagens claras),
 * erros de APIs externas (retorna o status original) e erros genéricos.
 *
 * Centralizar aqui evita repetir o mesmo try/catch em cada endpoint.
 */
import { Response } from 'express';

/**
 * Tratamento centralizado de erros Zod + genéricos em controllers.
 * Evita repetição do padrão if(error.name === 'ZodError') em cada endpoint.
 */
export function handleControllerError(res: Response, error: any, fallbackMessage = 'Erro interno') {
  if (error && error.name === 'ZodError') {
    const msgs = Array.isArray(error.errors)
      ? error.errors.map((e: any) => e.message).join(', ')
      : 'Erro de validação';
    return res.status(400).json({ error: msgs });
  }

  // Erros de API externa (OpenRouter, etc.)
  if (error?.status && typeof error.status === 'number') {
    return res.status(error.status).json({
      error: error.message || fallbackMessage
    });
  }

  return res.status(400).json({ error: error?.message || fallbackMessage });
}
