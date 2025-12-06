import { Router } from 'express';
import AIController from '../controllers/ai.controller';
import authMiddleware from '../middlewares/auth.midd';
import SecurityConfig from '../config/security/security.config';
import { cacheMiddleware } from '../middlewares/cache.midd';
import { validateAIMessage, handleValidationErrors } from '../utils/validators';

const router = Router();

router.post(
  '/chat', 
  authMiddleware, 
  SecurityConfig.aiRateLimiter,
  validateAIMessage, 
  handleValidationErrors, 
  AIController.chat
);

router.get(
  '/conversations', 
  authMiddleware, 
  cacheMiddleware(300000), // Cache de 5 minutos
  AIController.getConversations
);

router.get(
  '/conversations/:id', 
  authMiddleware, 
  cacheMiddleware(300000),
  AIController.getConversation
);

router.delete(
  '/conversations/:id', 
  authMiddleware, 
  AIController.deleteConversation
);

export default router;