"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = exports.validateAIMessage = exports.validateLogin = exports.validateRegister = void 0;
const express_validator_1 = require("express-validator");
exports.validateRegister = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
];
exports.validateLogin = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Senha é obrigatória')
];
exports.validateAIMessage = [
    (0, express_validator_1.body)('message')
        .trim()
        .notEmpty()
        .withMessage('Mensagem é obrigatória'),
    (0, express_validator_1.body)('conversationId')
        .custom((value) => {
        if (!value)
            return true; // aceita null, undefined, ""
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        return uuidRegex.test(value);
    })
        .withMessage('ID de conversa inválido')
];
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            errors: errors.array().map((err) => ({
                field: err.path || err.param || 'unknown',
                message: err.msg
            }))
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
