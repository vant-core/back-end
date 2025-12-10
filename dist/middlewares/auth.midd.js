"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_util_1 = __importDefault(require("../utils/jwt.util"));
const database_1 = __importDefault(require("../config/database"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jwt_util_1.default.verifyToken(token);
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, name: true, email: true }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Usuário não encontrado'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
        });
    }
};
exports.default = authMiddleware;
