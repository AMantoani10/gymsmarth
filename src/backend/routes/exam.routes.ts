import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const examController = new ExamController();

// Rotas protegidas (Apenas quem está logado pode enviar exames)
router.use(authMiddleware);

router.post('/analyze', examController.analyze);
router.get('/my-exams', examController.getMyExams);

export default router;
