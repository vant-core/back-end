import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/user';
import { RagQuery } from '../types/rag';
import ragOrchestratorService from '../training/rag-orchestrator.service';
import logger from '../config/security/logger.config';

class RagController {
  async query(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question }: RagQuery = req.body;

      if (!question) {
        res.status(400).json({
          success: false,
          message: 'Pergunta é obrigatória'
        });
        return;
      }

      const result = await ragOrchestratorService.query({ question });

      logger.info(`Query RAG processada: ${question}`);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro na query RAG:', error);
      next(error);
    }
  }
}

export default new RagController();