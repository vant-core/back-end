import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import authMiddleware from '../middlewares/auth.midd';
import { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} from '../utils/validators';

const router = Router();

router.post('/register', validateRegister, handleValidationErrors, AuthController.register);
router.post('/login', validateLogin, handleValidationErrors, AuthController.login);
router.get('/me', authMiddleware, AuthController.me);

export default router;