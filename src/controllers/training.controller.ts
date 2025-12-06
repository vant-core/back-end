import { Request, Response, NextFunction } from 'express';
import ingestionService from '../training/ingestion.service';
import logger from '../config/security/logger.config';

class TrainingController {
  async train(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado'
        });
        return;
      }

      const result = await ingestionService.ingestFile(req.file.path);

      logger.info(`Treinamento concluído: ${req.file.originalname}`);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro no treinamento:', error);
      next(error);
    }
  }
}

export default new TrainingController();