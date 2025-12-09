// src/routes/workspace.routes.ts

import { Router } from "express";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/user";
import prisma from "../config/database";
import logger from "../config/security/logger.config";
import cacheManager from "../config/security/cache.config";

const router = Router();

/**
 * 🔥 GET /api/workspace/folders
 * Lista todas as pastas do usuário com contagem de items
 */
router.get("/folders", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Busca pastas com contagem de items
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
            icon: true,
            color: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatar resposta
    const formattedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      description: folder.description,
      icon: folder.icon,
      color: folder.color,
      parentId: folder.parentId,
      itemCount: folder._count.items,
      subFolders: folder.subFolders,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    }));

    res.json({
      success: true,
      data: {
        folders: formattedFolders,
        total: formattedFolders.length
      }
    });

    logger.info(`Pastas listadas para usuário ${userId}`);

  } catch (error) {
    logger.error("Erro ao listar pastas:", error);
    next(error);
  }
});

/**
 * 🔥 GET /api/workspace/folders/:id
 * Busca uma pasta específica com seus items
 */
router.get("/folders/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId
      },
      include: {
        items: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    if (!folder) {
      res.status(404).json({
        success: false,
        message: "Pasta não encontrada"
      });
      return;
    }

    res.json({
      success: true,
      data: {
        folder: {
          ...folder,
          itemCount: folder._count.items
        }
      }
    });

  } catch (error) {
    logger.error("Erro ao buscar pasta:", error);
    next(error);
  }
});

/**
 * 🔥 GET /api/workspace/items
 * Lista todos os items do usuário (com filtros opcionais)
 */
router.get("/items", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { folderId, itemType, search } = req.query;

    const whereClause: any = { userId };

    if (folderId) {
      whereClause.folderId = folderId as string;
    }

    if (itemType) {
      whereClause.itemType = itemType as string;
    }

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

    // Filtro de busca por texto (se fornecido)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      items = items.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const contentMatch = JSON.stringify(item.content).toLowerCase().includes(searchLower);
        return titleMatch || contentMatch;
      });
    }

    res.json({
      success: true,
      data: {
        items,
        total: items.length
      }
    });

  } catch (error) {
    logger.error("Erro ao listar items:", error);
    next(error);
  }
});

/**
 * 🔥 GET /api/workspace/items/:id
 * Busca um item específico
 */
router.get("/items/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const item = await prisma.folderItem.findFirst({
      where: {
        id,
        userId
      },
      include: {
        folder: true
      }
    });

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Item não encontrado"
      });
      return;
    }

    res.json({
      success: true,
      data: { item }
    });

  } catch (error) {
    logger.error("Erro ao buscar item:", error);
    next(error);
  }
});

/**
 * 🔥 DELETE /api/workspace/folders/:id
 * Deleta uma pasta (e seus items via cascade)
 */
router.delete("/folders/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!folder) {
      res.status(404).json({
        success: false,
        message: "Pasta não encontrada"
      });
      return;
    }

    await prisma.folder.delete({
      where: { id }
    });

    // Limpa cache
    cacheManager.delete(`cache:${userId}:/api/workspace/folders`);

    res.json({
      success: true,
      message: `Pasta "${folder.name}" deletada com sucesso`
    });

    logger.info(`Pasta ${id} deletada pelo usuário ${userId}`);

  } catch (error) {
    logger.error("Erro ao deletar pasta:", error);
    next(error);
  }
});

/**
 * 🔥 DELETE /api/workspace/items/:id
 * Deleta um item específico
 */
router.delete("/items/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const item = await prisma.folderItem.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!item) {
      res.status(404).json({
        success: false,
        message: "Item não encontrado"
      });
      return;
    }

    await prisma.folderItem.delete({
      where: { id }
    });

    // Limpa cache
    cacheManager.delete(`cache:${userId}:/api/workspace/items`);

    res.json({
      success: true,
      message: "Item deletado com sucesso"
    });

    logger.info(`Item ${id} deletado pelo usuário ${userId}`);

  } catch (error) {
    logger.error("Erro ao deletar item:", error);
    next(error);
  }
});

/**
 * 🔥 GET /api/workspace/stats
 * Estatísticas do workspace do usuário
 */
router.get("/stats", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const [totalFolders, totalItems, itemsByType] = await Promise.all([
      prisma.folder.count({ where: { userId } }),
      prisma.folderItem.count({ where: { userId } }),
      prisma.folderItem.groupBy({
        by: ['itemType'],
        where: { userId },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        totalFolders,
        totalItems,
        itemsByType: itemsByType.map(item => ({
          type: item.itemType || 'sem_tipo',
          count: item._count
        }))
      }
    });

  } catch (error) {
    logger.error("Erro ao buscar estatísticas:", error);
    next(error);
  }
});

export default router;