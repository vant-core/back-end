"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../services/user.service"));
const jwt_util_1 = __importDefault(require("../utils/jwt.util"));
class AuthController {
    async register(req, res, next) {
        try {
            const { name, email, password } = req.body;
            const existingUser = await user_service_1.default.findUserByEmail(email);
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Email já cadastrado'
                });
                return;
            }
            const user = await user_service_1.default.createUser({ name, email, password });
            const token = jwt_util_1.default.generateToken({ userId: user.id });
            res.status(201).json({
                success: true,
                message: 'Usuário criado com sucesso',
                data: {
                    user,
                    token
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await user_service_1.default.findUserByEmail(email);
            if (!user || !user.password) {
                res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
                return;
            }
            const isValidPassword = await user_service_1.default.validatePassword(password, user.password);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    message: 'Credenciais inválidas'
                });
                return;
            }
            const token = jwt_util_1.default.generateToken({ userId: user.id });
            const { password: _, ...userWithoutPassword } = user;
            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                data: {
                    user: userWithoutPassword,
                    token
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            const user = await user_service_1.default.findUserById(req.user.id);
            res.json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new AuthController();
