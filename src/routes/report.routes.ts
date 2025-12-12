import { Router } from 'express';
import reportController from '../controllers/report.controller';

const router = Router();

// Preview do relatório (retorna HTML)
router.post('/preview', reportController.preview);

// Gerar PDF a partir dos dados do workspace
router.post('/generate-pdf', reportController.generatePDF);

// Gerar PDF a partir de HTML customizado
router.post('/generate-from-html', reportController.generateFromHTML);

export default router;