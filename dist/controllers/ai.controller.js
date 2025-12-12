"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openAi_service_1 = __importDefault(require("../services/openAi.service"));
const conversation_service_1 = __importDefault(require("../services/conversation.service"));
const security_config_1 = __importDefault(require("../config/security/security.config"));
const logger_config_1 = __importDefault(require("../config/security/logger.config"));
const cache_config_1 = __importDefault(require("../config/security/cache.config"));
class AIController {
    async chat(req, res, next) {
        try {
            const { message, conversationId } = req.body;
            const userId = req.user.id;
            let conversation;
            let conversationHistory = [];
            // Recupera ou cria conversa
            if (conversationId) {
                conversation = await conversation_service_1.default.getConversation(conversationId, userId);
                conversationHistory = conversation.messages.slice(-10);
            }
            else {
                conversation = await conversation_service_1.default.createConversation(userId);
            }
            // Salva mensagem do usuário
            await conversation_service_1.default.addMessage(conversation.id, userId, 'user', message);
            // 🔥 Chamada para a IA (agora com userId)
            const aiResponse = await openAi_service_1.default.chat(message, userId, // 🔥 NOVO: passa userId
            conversationHistory);
            console.log('🔍 AIController - Resposta recebida:', {
                hasFile: !!aiResponse.file,
                hasWorkspace: !!aiResponse.workspace,
                hasReport: !!aiResponse.report // 🔥 NOVO
            });
            // 🔥 CASO 1: ARQUIVO GERADO
            if (aiResponse.file) {
                const messageContent = `${aiResponse.content}\n\n📎 Arquivo: ${aiResponse.file.name}.${aiResponse.file.type}`;
                await conversation_service_1.default.addMessage(conversation.id, userId, 'assistant', messageContent);
                res.json({
                    success: true,
                    data: {
                        conversationId: conversation.id,
                        message: aiResponse.content,
                        file: aiResponse.file, // 🔥 Informações do arquivo
                        usage: aiResponse.usage
                    }
                });
                return;
            }
            // 🔥 CASO 2: RELATÓRIO GERADO (NOVO)
            if (aiResponse.report) {
                console.log('📊 AIController - Relatório detectado, enviando ao frontend');
                await conversation_service_1.default.addMessage(conversation.id, userId, 'assistant', aiResponse.content);
                res.json({
                    success: true,
                    data: {
                        conversationId: conversation.id,
                        message: aiResponse.content,
                        report: aiResponse.report, // 🔥 Dados do relatório (HTML + data)
                        usage: aiResponse.usage
                    }
                });
                return;
            }
            // 🔥 CASO 3: AÇÃO DE WORKSPACE
            if (aiResponse.workspace) {
                await conversation_service_1.default.addMessage(conversation.id, userId, 'assistant', aiResponse.content);
                res.json({
                    success: true,
                    data: {
                        conversationId: conversation.id,
                        message: aiResponse.content,
                        workspace: aiResponse.workspace, // 🔥 Dados do workspace
                        usage: aiResponse.usage
                    }
                });
                return;
            }
            // 🔥 CASO 4: RESPOSTA NORMAL
            await conversation_service_1.default.addMessage(conversation.id, userId, 'assistant', aiResponse.content);
            res.json({
                success: true,
                data: {
                    conversationId: conversation.id,
                    message: aiResponse.content,
                    usage: aiResponse.usage
                }
            });
            // Limpa cache
            cache_config_1.default.delete(`cache:${userId}:/api/ai/conversations`);
            logger_config_1.default.info(`Mensagem processada para usuário ${userId} na conversa ${conversation.id}`);
        }
        catch (error) {
            logger_config_1.default.error('Erro ao processar chat:', error);
            next(error);
        }
    }
    async getConversations(req, res, next) {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;
            const conversations = await conversation_service_1.default.getUserConversations(userId, limit);
            const conversationsWithLinks = conversations.map(conv => security_config_1.default.addHATEOASLinks(conv, req, 'conversation'));
            const responseWithLinks = security_config_1.default.addHATEOASLinks({ conversations: conversationsWithLinks }, req, 'conversations');
            res.json({
                success: true,
                data: responseWithLinks
            });
        }
        catch (error) {
            logger_config_1.default.error('Erro ao buscar conversas:', error);
            next(error);
        }
    }
    async getConversation(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const conversation = await conversation_service_1.default.getConversation(id, userId);
            const conversationWithLinks = security_config_1.default.addHATEOASLinks(conversation, req, 'conversation');
            res.json({
                success: true,
                data: { conversation: conversationWithLinks }
            });
        }
        catch (error) {
            logger_config_1.default.error('Erro ao buscar conversa:', error);
            next(error);
        }
    }
    async deleteConversation(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            await conversation_service_1.default.deleteConversation(id, userId);
            cache_config_1.default.delete(`cache:${userId}:/api/ai/conversations`);
            cache_config_1.default.delete(`cache:${userId}:/api/ai/conversations/${id}`);
            logger_config_1.default.info(`Conversa ${id} deletada pelo usuário ${userId}`);
            res.json({
                success: true,
                message: 'Conversa deletada com sucesso'
            });
        }
        catch (error) {
            logger_config_1.default.error('Erro ao deletar conversa:', error);
            next(error);
        }
    }
}
exports.default = new AIController();
