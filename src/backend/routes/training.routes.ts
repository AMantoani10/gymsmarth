/**
 * training.routes.ts — Rotas de Treino (lado aluno)
 *
 * Rotas protegidas (alunos e admins):
 * - GET /api/training/next            → Próxima sessão de treino
 * - GET /api/training/all             → Todas as sessões do treino ativo
 * - POST /api/training/log            → Registrar conclusão de sessão
 * - POST /api/training/carga          → Salvar carga de exercício
 * - GET /api/training/carga/:exercicio → Histórico de cargas por exercício
 */
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
