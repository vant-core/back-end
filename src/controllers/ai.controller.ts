import { Response, NextFunction } from 'express';
import PerplexityService from '../services/openAi.service';
import ConversationService from '../services/conversation.service';
import { AuthRequest, ChatMessageDTO } from '../types/user';
import SecurityConfig from '../config/security/security.config';
import logger from '../config/security/logger.config';
import cacheManager from '../config/security/cache.config';

class AIController {
  async chat(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, conversationId }: ChatMessageDTO = req.body;
      const userId = req.user!.id;

      let conversation;
      let conversationHistory: any[] = [];

      // Recupera ou cria conversa
      if (conversationId) {
        conversation = await ConversationService.getConversation(conversationId, userId);
        conversationHistory = conversation.messages.slice(-10); // últimos 10 msgs
      } else {
        conversation = await ConversationService.createConversation(userId);
      }

      // Salva mensagem do usuário
      await ConversationService.addMessage(conversation.id, userId, 'user', message);


      // Chamada para a IA — sem RAG
      const aiResponse = await PerplexityService.chat(
        message,
        conversationHistory
      );

      // Salva resposta da IA
     await ConversationService.addMessage(conversation.id, userId, 'assistant', aiResponse.content);


      // Limpa cache
      cacheManager.delete(`cache:${userId}:/api/ai/conversations`);

      logger.info(`Mensagem processada para usuário ${userId} na conversa ${conversation.id}`);

      const conversationWithLinks = SecurityConfig.addHATEOASLinks(
        {
          conversationId: conversation.id,
          message: aiResponse.content,
          usage: aiResponse.usage
        },
        req,
        'conversation'
      );

      res.json({
        success: true,
        data: conversationWithLinks
      });
    } catch (error) {
      logger.error('Erro ao processar chat:', error);
      next(error);
    }
  }

  async getConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const conversations = await ConversationService.getUserConversations(userId, limit);

      const conversationsWithLinks = conversations.map(conv =>
        SecurityConfig.addHATEOASLinks(conv, req, 'conversation')
      );

      const responseWithLinks = SecurityConfig.addHATEOASLinks(
        { conversations: conversationsWithLinks },
        req,
        'conversations'
      );

      res.json({
        success: true,
        data: responseWithLinks
      });
    } catch (error) {
      logger.error('Erro ao buscar conversas:', error);
      next(error);
    }
  }

  async getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const conversation = await ConversationService.getConversation(id, userId);

      const conversationWithLinks = SecurityConfig.addHATEOASLinks(
        conversation,
        req,
        'conversation'
      );

      res.json({
        success: true,
        data: { conversation: conversationWithLinks }
      });
    } catch (error) {
      logger.error('Erro ao buscar conversa:', error);
      next(error);
    }
  }

  async deleteConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await ConversationService.deleteConversation(id, userId);

      cacheManager.delete(`cache:${userId}:/api/ai/conversations`);
      cacheManager.delete(`cache:${userId}:/api/ai/conversations/${id}`);

      logger.info(`Conversa ${id} deletada pelo usuário ${userId}`);

      res.json({
        success: true,
        message: 'Conversa deletada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao deletar conversa:', error);
      next(error);
    }
  }
}

export default new AIController();
