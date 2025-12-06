import prisma from '../config/database';
import { Conversation, Message } from '@prisma/client';

type ConversationWithMessages = Conversation & {
  messages: Message[];
};

class ConversationService {
  async createConversation(userId: string): Promise<ConversationWithMessages> {
    return await prisma.conversation.create({
      data: { userId },
      include: { messages: true }
    });
  }

  async getConversation(conversationId: string, userId: string): Promise<ConversationWithMessages> {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!conversation) throw new Error('Conversa não encontrada');

    return conversation;
  }

  async getUserConversations(userId: string, limit: number = 10): Promise<any[]> {
    return await prisma.conversation.findMany({
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

  async addMessage(conversationId: string, role: string, content: string): Promise<Message> {
    const message = await prisma.message.create({
      data: { conversationId, role, content }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return message;
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId }
    });

    if (!conversation) throw new Error('Conversa não encontrada');

    await prisma.conversation.delete({
      where: { id: conversationId }
    });
  }
}

export default new ConversationService();
