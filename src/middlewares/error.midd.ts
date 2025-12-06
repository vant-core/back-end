import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  errors?: any;
}

const errorHandler = (err: CustomError, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Erro:', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: err.errors
    });
    return;
  }

  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'Já existe um registro com esses dados'
    });
    return;
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  });
};

export default errorHandler;
