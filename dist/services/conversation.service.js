"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class ConversationService {
    async createConversation(userId) {
        return await database_1.default.conversation.create({
            data: { userId },
            include: { messages: true }
        });
    }
    async getConversation(conversationId, userId) {
        const conversation = await database_1.default.conversation.findUnique({
            where: {
                id_userId: {
                    id: conversationId,
                    userId
                }
            },
            include: {
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });
        if (!conversation)
            throw new Error('Conversa não encontrada');
        return conversation;
    }
    async getUserConversations(userId, limit = 10) {
        return await database_1.default.conversation.findMany({
            where: { userId },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: limit
        });
    }
    async addMessage(conversationId, userId, role, content // 👈 Permite null
    ) {
        await database_1.default.conversation.findUniqueOrThrow({
            where: {
                id_userId: {
                    id: conversationId,
                    userId
                }
            }
        });
        const message = await database_1.default.message.create({
            data: {
                conversationId,
                role,
                content: content || null // ✅ Aceita null explicitamente
            }
        });
        await database_1.default.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });
        return message;
    }
    async deleteConversation(conversationId, userId) {
        await database_1.default.conversation.findUniqueOrThrow({
            where: {
                id_userId: {
                    id: conversationId,
                    userId
                }
            }
        });
        await database_1.default.conversation.delete({
            where: { id: conversationId }
        });
    }
}
exports.default = new ConversationService();
