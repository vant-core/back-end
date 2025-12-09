// src/services/ai/workspaceHandlers.ts

import prisma from "../../config/database";
import type { CreateFolderDTO, CreateItemDTO } from "../../types/user";

export class WorkspaceHandlers {
  
  /**
   * 🔥 Cria uma nova pasta/categoria
   */
  static async createFolder(userId: string, args: any) {
    const { 
      name, 
      description, 
      icon = "📁", 
      color = "#3B82F6",
      parentId 
    } = args;

    try {
      const folder = await prisma.folder.create({
        data: {
          userId,
          name,
          description,
          icon,
          color,
          parentId: parentId || null
        }
      });

      return {
        success: true,
        folder,
        message: `✅ Pasta "${name}" criada com sucesso!`
      };

    } catch (error) {
      console.error("❌ Erro ao criar pasta:", error);
      throw new Error("Falha ao criar pasta");
    }
  }

  /**
   * 🔥 Adiciona um item em uma pasta (cria a pasta se não existir)
   */
  static async addItemToFolder(userId: string, args: any) {
    const { 
      folderName, 
      title, 
      content = {}, // 🔥 DEFAULT: objeto vazio se não vier
      itemType,
      tags = [] 
    } = args;

    // 🔥 VALIDAÇÃO: garantir que content seja um objeto
    const safeContent = typeof content === 'object' && content !== null 
      ? content 
      : { data: String(content) };

    console.log("📦 addItemToFolder chamado com:", { folderName, title, content: safeContent, itemType, tags });

    try {
      // 1. Buscar pasta existente
      let folder = await prisma.folder.findFirst({
        where: {
          userId,
          name: {
            equals: folderName,
            mode: 'insensitive' // case-insensitive
          }
        }
      });

      // 2. Se não existir, criar automaticamente
      if (!folder) {
        folder = await prisma.folder.create({
          data: {
            userId,
            name: folderName,
            icon: this.getIconForType(itemType),
            color: this.getColorForType(itemType)
          }
        });
      }

      // 3. Criar o item
      const item = await prisma.folderItem.create({
        data: {
          folderId: folder.id,
          userId,
          title,
          content: safeContent, // 🔥 GARANTIDO QUE É UM OBJETO
          itemType,
          tags
        },
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true
            }
          }
        }
      });

      return {
        success: true,
        item,
        folder,
        message: `✅ Item "${title}" adicionado à pasta "${folderName}"`
      };

    } catch (error) {
      console.error("❌ Erro ao adicionar item:", error);
      throw new Error("Falha ao adicionar item");
    }
  }

  /**
   * 🔥 Busca uma pasta específica com todos os seus items
   */
  static async getFolder(userId: string, args: any) {
    const { folderId } = args;

    try {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId
        },
        include: {
          items: {
            orderBy: { createdAt: 'desc' }
          },
          subFolders: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          },
          _count: {
            select: { items: true }
          }
        }
      });

      if (!folder) {
        return {
          success: false,
          message: "❌ Pasta não encontrada"
        };
      }

      return {
        success: true,
        folder: {
          ...folder,
          itemCount: folder._count.items
        }
      };

    } catch (error) {
      console.error("❌ Erro ao buscar pasta:", error);
      throw new Error("Falha ao buscar pasta");
    }
  }

  /**
   * 🔥 Lista todos os items de uma pasta específica
   */
  static async getFolderItems(userId: string, args: any) {
    const { folderId } = args;

    try {
      // Verificar se a pasta pertence ao usuário
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId
        }
      });

      if (!folder) {
        return {
          success: false,
          message: "❌ Pasta não encontrada"
        };
      }

      // Buscar items
      const items = await prisma.folderItem.findMany({
        where: {
          folderId,
          userId
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        items,
        count: items.length
      };

    } catch (error) {
      console.error("❌ Erro ao buscar items da pasta:", error);
      throw new Error("Falha ao buscar items");
    }
  }

  /**
   * 🔥 Lista todas as pastas do usuário com contagem de items
   */
  static async listFolders(userId: string) {
    try {
      const folders = await prisma.folder.findMany({
        where: { userId },
        include: {
          _count: {
            select: { items: true }
          },
          subFolders: {
            select: {
              id: true,
              name: true,
              icon: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Transformar para formato mais amigável
      const formattedFolders = folders.map(folder => ({
        ...folder,
        itemCount: folder._count.items
      }));

      return {
        success: true,
        folders: formattedFolders
      };

    } catch (error) {
      console.error("❌ Erro ao listar pastas:", error);
      throw new Error("Falha ao listar pastas");
    }
  }

  /**
   * 🔥 Busca items por query, pasta ou tags
   */
  static async searchItems(userId: string, args: any) {
    const { query, folderName, tags } = args;

    try {
      const whereClause: any = { userId };

      // Filtrar por pasta
      if (folderName) {
        const folder = await prisma.folder.findFirst({
          where: {
            userId,
            name: {
              contains: folderName,
              mode: 'insensitive'
            }
          }
        });

        if (folder) {
          whereClause.folderId = folder.id;
        }
      }

      // Filtrar por tags
      if (tags && tags.length > 0) {
        whereClause.tags = {
          hasSome: tags
        };
      }

      // Buscar items
      let items = await prisma.folderItem.findMany({
        where: whereClause,
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Filtrar por query de texto (título ou conteúdo)
      if (query) {
        items = items.filter(item => {
          const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
          const contentMatch = JSON.stringify(item.content).toLowerCase().includes(query.toLowerCase());
          return titleMatch || contentMatch;
        });
      }

      return {
        success: true,
        items,
        count: items.length
      };

    } catch (error) {
      console.error("❌ Erro ao buscar items:", error);
      throw new Error("Falha ao buscar items");
    }
  }

  /**
   * 🔥 Deleta uma pasta (e seus items)
   */
  static async deleteFolder(userId: string, args: any) {
    const { folderId } = args;

    try {
      // Verificar se a pasta pertence ao usuário
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId
        }
      });

      if (!folder) {
        return {
          success: false,
          message: "❌ Pasta não encontrada ou não pertence ao usuário"
        };
      }

      // Deletar pasta (cascade irá deletar os items)
      await prisma.folder.delete({
        where: { id: folderId }
      });

      return {
        success: true,
        message: `✅ Pasta "${folder.name}" deletada com sucesso!`
      };

    } catch (error) {
      console.error("❌ Erro ao deletar pasta:", error);
      throw new Error("Falha ao deletar pasta");
    }
  }

  /**
   * 🔥 Deleta um item específico
   */
  static async deleteItem(userId: string, args: any) {
    const { itemId } = args;

    try {
      // Verificar se o item pertence ao usuário
      const item = await prisma.folderItem.findFirst({
        where: {
          id: itemId,
          userId
        }
      });

      if (!item) {
        return {
          success: false,
          message: "❌ Item não encontrado ou não pertence ao usuário"
        };
      }

      // Deletar item
      await prisma.folderItem.delete({
        where: { id: itemId }
      });

      return {
        success: true,
        message: `✅ Item "${item.title}" deletado com sucesso!`
      };

    } catch (error) {
      console.error("❌ Erro ao deletar item:", error);
      throw new Error("Falha ao deletar item");
    }
  }

  /**
   * 🎨 Helper: Define ícone baseado no tipo do item
   */
  private static getIconForType(itemType?: string): string {
    const iconMap: Record<string, string> = {
      'compra': '🛒',
      'evento': '🎉',
      'tarefa': '✅',
      'nota': '📝',
      'fornecedor': '🏢',
      'pagamento': '💰',
      'contrato': '📄'
    };

    return iconMap[itemType?.toLowerCase() || ''] || '📁';
  }

  /**
   * 🎨 Helper: Define cor baseado no tipo do item
   */
  private static getColorForType(itemType?: string): string {
    const colorMap: Record<string, string> = {
      'compra': '#10B981',      // verde
      'evento': '#8B5CF6',      // roxo
      'tarefa': '#3B82F6',      // azul
      'nota': '#F59E0B',        // laranja
      'fornecedor': '#6366F1',  // indigo
      'pagamento': '#EF4444',   // vermelho
      'contrato': '#06B6D4'     // cyan
    };

    return colorMap[itemType?.toLowerCase() || ''] || '#3B82F6';
  }
}