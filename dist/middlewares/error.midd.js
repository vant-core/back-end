"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (err, _req, res, _next) => {
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
exports.default = errorHandler;
