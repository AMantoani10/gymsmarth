import { z } from 'zod';

export const CreateStudentSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6),
  plano_id: z.string().uuid(),
  data_inicio: z.string().optional().nullable(), // ISO Date
  data_fim: z.string().optional().nullable(), // ISO Date
});


export const CreatePlanSchema = z.object({
  nome: z.string().min(3),
  duracao_dias: z.number().int().min(1),
  valor: z.number().min(0),
  descricao: z.string().optional().nullable(),
});
