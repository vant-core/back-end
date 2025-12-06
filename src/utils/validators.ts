import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRegister: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];

export const validateLogin: ValidationChain[] = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('Senha é obrigatória')
];

export const validateAIMessage: ValidationChain[] = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Mensagem é obrigatória'),

  body('conversationId')
    .custom((value) => {
      if (!value) return true; // aceita null, undefined, ""
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      return uuidRegex.test(value);
    })
    .withMessage('ID de conversa inválido')
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((err: any) => ({
        field: err.path || err.param || 'unknown',
        message: err.msg
      }))
    });
    return;
  }

  next();
};