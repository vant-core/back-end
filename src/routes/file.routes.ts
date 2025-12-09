import { Router } from 'express';
import FileController from '../controllers/file.controller';
import authenticateToken from '../middlewares/auth.midd';

const router = Router();

/**
 * @route   GET /api/files/download/:fileName
 * @desc    Baixa um arquivo gerado pela IA
 * @access  Private
 */
router.get('/download/:fileName', authenticateToken, FileController.downloadFile);

/**
 * @route   GET /api/files/list
 * @desc    Lista todos os arquivos (opcional - útil para debug)
 * @access  Private
 */
router.get('/list', authenticateToken, FileController.listFiles);

export default router;