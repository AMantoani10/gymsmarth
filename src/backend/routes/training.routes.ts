import { Router } from 'express';
import { TrainingController } from '../controllers/TrainingController';
import { authMiddleware, hasRole } from '../middlewares/auth';

const router = Router();
const trainingController = new TrainingController();

router.use(authMiddleware, hasRole(['ALUNO', 'ADMIN']));

router.get('/next', trainingController.getNextTrainingSession);
router.post('/log', trainingController.logSession);
router.get('/all', trainingController.getAllTrainingSessions);
router.post('/carga', trainingController.saveCarga);
router.get('/carga/:exercicio', trainingController.getHistoricoCarga);

export default router;
