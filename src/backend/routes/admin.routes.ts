/**
 * admin.routes.ts — Rotas protegidas do Administrador
 *
 * TODAS as rotas aqui exigem: authMiddleware + isAdmin.
 * Ou seja, apenas usuários logados com role='ADMIN' acessam.
 *
 * Agrupa CRUD de planos, treinos, alunos, exames, notificações e logs.
 */
import { Router } from 'express';
import { PlanController } from '../controllers/PlanController';
import { TreinoController } from '../controllers/TreinoController';
import { StudentController } from '../controllers/StudentController';
import { ExamController } from '../controllers/ExamController';
import { LogController } from '../controllers/LogController';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware, isAdmin } from '../middlewares/auth';

const router = Router();
const planController = new PlanController();
const treinoController = new TreinoController();
const studentController = new StudentController();
const examController = new ExamController();
const logController = new LogController();
const notificationController = new NotificationController();

router.use(authMiddleware, isAdmin);

router.post('/plans', planController.create);
router.get('/plans', planController.list);
router.put('/plans/:id', planController.update);
router.delete('/plans/:id', planController.delete);

router.post('/treinos', treinoController.create);
router.get('/treinos', treinoController.listAdmin);
router.put('/treinos/:id', treinoController.update);
router.delete('/treinos/:id', treinoController.delete);
router.get('/exercicios', treinoController.getExercicios);

// Alunos created via auth/students, listed via students. Let's make it consistent here
router.post('/students', studentController.create);
router.get('/students', studentController.list);
router.put('/students/:id', studentController.update);
router.delete('/students/:id', studentController.delete);
router.post('/students/:id/renew', studentController.renew);

router.get('/exams', examController.listAll);
router.delete('/exams/:id', examController.delete);

router.get('/notifications', notificationController.listAll);
router.post('/notifications/:id/dismiss', notificationController.dismiss);

router.get('/logs', logController.list);

export default router;
