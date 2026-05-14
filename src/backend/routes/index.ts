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
