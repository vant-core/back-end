import { Response, NextFunction } from 'express';
import UserService from '../services/user.service';
import JWTUtil from '../utils/jwt.util';
import { AuthRequest, RegisterDTO, LoginDTO } from '../types/user';

class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password }: RegisterDTO = req.body;

      const existingUser = await UserService.findUserByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Email já cadastrado'
        });
        return;
      }

      const user = await UserService.createUser({ name, email, password });
      const token = JWTUtil.generateToken({ userId: user.id });

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: LoginDTO = req.body;

      const user = await UserService.findUserByEmail(email);
      if (!user || !user.password) {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
        return;
      }

      const isValidPassword = await UserService.validatePassword(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
        return;
      }

      const token = JWTUtil.generateToken({ userId: user.id });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userWithoutPassword,
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.findUserById(req.user!.id);
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();