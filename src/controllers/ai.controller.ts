import { Response, NextFunction } from 'express';
import PerplexityService from '../services/perplexity.service';
import ConversationService from '../services/conversation.service';
import RagService from '../services/rag.service';
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

      if (conversationId) {
        conversation = await ConversationService.getConversation(conversationId, userId);
        conversationHistory = conversation.messages.slice(-10);
      } else {
        conversation = await ConversationService.createConversation(userId);
      }

      // RAG — pegar chunks relevantes
      const ragChunks = RagService.search(message);
      const ragContext = ragChunks.length
        ? ragChunks.map((c: { text: string }) => c.text).join('\n\n')
        : null;

      console.log('ragChunks length:', ragChunks.length);
      console.log('ragContext sample:', ragContext?.slice(0, 200));

      await ConversationService.addMessage(conversation.id, 'user', message);

      // injeta RAG como “instrucao” antes da pergunta
      if (ragContext) {
        conversationHistory.push({
          role: 'user',
          content:
            'Use ONLY the following internal document context to answer the next question:\n\n' +
            ragContext +
            '\n\nIf the answer is explicitly stated here, respond directly without asking for more context.'
        });
      }

      const aiResponse = await PerplexityService.chat(
        message,
        conversationHistory,
        ragContext // <– passa aqui também
      );

      await ConversationService.addMessage(conversation.id, 'assistant', aiResponse.content);

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
