"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
class UserService {
    async createUser(data) {
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await database_1.default.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return user;
    }
    async findUserByEmail(email) {
        return database_1.default.user.findUnique({
            where: { email }
        });
    }
    async findUserById(id) {
        return database_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
    async validatePassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    // ---------------------------------------------------------
    // NOVAS FUNÇÕES PARA INTEGRAÇÃO COM WHATSAPP
    // ---------------------------------------------------------
    async findUserByPhone(phone) {
        return database_1.default.user.findUnique({
            where: { phone }
        });
    }
    async findOrCreateByPhone(phone) {
        if (!phone) {
            throw new Error("Phone number is required");
        }
        let user = await database_1.default.user.findUnique({
            where: { phone }
        });
        if (!user) {
            user = await database_1.default.user.create({
                data: {
                    phone,
                    name: `WhatsApp User ${phone}`,
                    email: `${phone}@whatsapp.local`,
                    password: await bcryptjs_1.default.hash('whatsapp-temp', 10)
                }
            });
        }
        return user;
    }
}
exports.default = new UserService();
