import prisma from "../config/database";

class EventRegistrationService {
  async create(data: any, userId: string, conversationId?: string) {
    return prisma.eventRegistration.create({
      data: {
        userId,
        conversationId: conversationId || null,
        data
      }
    });
  }

  async update(id: string, data: any) {
    return prisma.eventRegistration.update({
      where: { id },
      data: { data }
    });
  }

  async getByUser(userId: string) {
    return prisma.eventRegistration.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async getByConversation(conversationId: string) {
    return prisma.eventRegistration.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" }
    });
  }

  async storeExtractedData(
    extractedData: any,
    userId: string,
    conversationId?: string
  ) {
    return prisma.eventRegistration.create({
      data: {
        userId,
        conversationId: conversationId || null,
        data: extractedData
      }
    });
  }
}

export default new EventRegistrationService();
