import { Router } from 'express';
import trainingController from '../controllers/training.controller';
import authMiddleware from '../middlewares/auth.midd';
import { uploadMiddleware } from '../middlewares/upload.midd';

const router = Router();

router.post('/train', authMiddleware, uploadMiddleware.single('file'), trainingController.train);

export default router;
