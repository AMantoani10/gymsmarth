/**
 * workout.routes.ts — Rota de Sugestão de Treino por IA
 *
 * Rota protegida (somente admin):
 * - POST /api/workouts/suggest → Gera sugestão de treino via OpenRouter (IA)
 */
import { Router } from 'express';
import { WorkoutController } from '../controllers/WorkoutController';
import { authMiddleware, isAdmin } from '../middlewares/auth';

const router = Router();
const workoutController = new WorkoutController();

// Apenas Admins podem solicitar geração de treinos por enquanto
router.use(authMiddleware, isAdmin);

router.post('/suggest', workoutController.suggestSmartWorkout);

export default router;
