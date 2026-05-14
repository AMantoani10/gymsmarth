import { Router } from 'express';
import { WorkoutController } from '../controllers/WorkoutController';
import { authMiddleware, isAdmin } from '../middlewares/auth';

const router = Router();
const workoutController = new WorkoutController();

// Apenas Admins podem solicitar geração de treinos por enquanto
router.use(authMiddleware, isAdmin);

router.post('/suggest', workoutController.suggestSmartWorkout);

export default router;
