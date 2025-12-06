import { Router } from 'express';
import ragController from '../controllers/rag.controller';
import authMiddleware from '../middlewares/auth.midd';

const router = Router();

router.post('/query', authMiddleware, ragController.query);

export default router;