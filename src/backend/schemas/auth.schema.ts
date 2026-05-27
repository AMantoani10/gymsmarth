/**
 * auth.schema.ts — Schemas de Validação para Autenticação
 *
 * Define schemas Zod para validar os dados de entrada nas rotas de auth.
 * Zod funciona como um "guardião" — se os dados não passarem pela validação,
 * a requisição é rejeitada antes de tocar o banco de dados.
 *
 * Schemas:
 * - LoginSchema: email válido + senha com 6+ chars
 * - RegisterAdminSchema: nome (3+ chars) + email + senha
 * - ForgotPasswordSchema: apenas email
 */
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const RegisterAdminSchema = z.object({
  nome: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});
