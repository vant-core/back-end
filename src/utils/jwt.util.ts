import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/user';

class JWTUtil {
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(
      payload as string | object | Buffer,
      process.env.JWT_SECRET as jwt.Secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      } as jwt.SignOptions
    );
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET as jwt.Secret
      ) as JWTPayload;
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }
}

export default JWTUtil;
