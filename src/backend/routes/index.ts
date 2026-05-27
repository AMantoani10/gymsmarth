/**
 * routes/index.ts — Agregador central de rotas
 *
 * Monta todas as sub-rotas sob o prefixo /api:
 * - /api/auth/*     → Autenticação (login, registro, recuperação de senha)
 * - /api/admin/*    → Operações do admin (alunos, planos, treinos, exames, notificações)
 * - /api/exams/*    → Exames do aluno (enviar e listar)
 * - /api/workouts/* → Sugestão de treino via IA (admin)
 * - /api/training/* → Treino do aluno (sessões, carga, log)
 *
 * Importado pelo server.ts com: app.use("/api", routes)
 */
import { Router } from 'express';
import authRoutes from './auth.routes';
import examRoutes from './exam.routes';
import workoutRoutes from './workout.routes';
import trainingRoutes from './training.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/exams', examRoutes);
router.use('/workouts', workoutRoutes);
router.use('/training', trainingRoutes);

export default router;
