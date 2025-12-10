"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
class EventRegistrationService {
    async create(data, userId, conversationId) {
        return database_1.default.eventRegistration.create({
            data: {
                userId,
                conversationId: conversationId || null,
                data
            }
        });
    }
    async update(id, data) {
        return database_1.default.eventRegistration.update({
            where: { id },
            data: { data }
        });
    }
    async getByUser(userId) {
        return database_1.default.eventRegistration.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
    }
    async getByConversation(conversationId) {
        return database_1.default.eventRegistration.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" }
        });
    }
    async storeExtractedData(extractedData, userId, conversationId) {
        return database_1.default.eventRegistration.create({
            data: {
                userId,
                conversationId: conversationId || null,
                data: extractedData
            }
        });
    }
}
exports.default = new EventRegistrationService();
