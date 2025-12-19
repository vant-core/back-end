import { Router } from "express";
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import prisma from "../config/database";
import logger from "../config/security/logger.config";
import cacheManager from "../config/security/cache.config";
import authMiddleware from "../middlewares/auth.midd";
import { WorkspaceHandlers } from "../services/workspace/workspaceHandlers";

const router = Router();

/* ============================================================
   GET /api/workspace/folders  → Lista pastas (inclui subpastas)
   ============================================================ */
router.get("/folders", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
        subFolders: {
          select: { id: true, name: true, icon: true, color: true, parentId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = folders.map(folder => ({
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

    res.json({ success: true, data: { folders: formatted, total: formatted.length } });
    logger.info(`Pastas listadas para usuário ${userId}`);

  } catch (error) {
    logger.error("Erro ao listar pastas:", error);
    next(error);
  }
});


router.get("/folders/:id", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: { id, userId },
      include: {
        items: { orderBy: { createdAt: "desc" } },
        subFolders: {
          select: { id: true, name: true, icon: true, color: true, parentId: true }
        },
        _count: { select: { items: true } }
      }
    });

    if (!folder) return res.status(404).json({ success: false, message: "Pasta não encontrada" });

    res.json({
      success: true,
      data: { folder: { ...folder, itemCount: folder._count.items } }
    });

  } catch (error) {
    logger.error("Erro ao buscar pasta:", error);
    next(error);
  }
});

/* ============================================================
   🔥 NOVO
   POST /api/workspace/folders/path
   Cria estrutura profunda: "Eventos/Coca-Cola/Financeiro"
   ============================================================ */
router.post("/folders/path", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { path, icon, color } = req.body;

    const result = await WorkspaceHandlers.createFolderPath(userId, { path, icon, color });

    res.json({ success: true, data: result });

  } catch (error) {
    logger.error("Erro ao criar caminho de pastas:", error);
    next(error);
  }
});

/* ============================================================
   GET /api/workspace/items  → lista todos ou filtra por query
   ============================================================ */
router.get("/items", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { folderId, itemType, search } = req.query;

    const where: any = { userId };

    if (folderId) where.folderId = folderId;
    if (itemType) where.itemType = itemType;

    let items = await prisma.folderItem.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true, icon: true, color: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        JSON.stringify(i.content).toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: { items, total: items.length } });

  } catch (error) {
    logger.error("Erro ao listar items:", error);
    next(error);
  }
});

/* ============================================================
   GET /api/workspace/items/:id
   ============================================================ */
router.get("/items/:id", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const item = await prisma.folderItem.findFirst({
      where: { id, userId },
      include: { folder: true }
    });

    if (!item) return res.status(404).json({ success: false, message: "Item não encontrado" });

    res.json({ success: true, data: { item } });

  } catch (error) {
    logger.error("Erro ao buscar item:", error);
    next(error);
  }
});

/* ============================================================
   🔥 NOVO
   POST /api/workspace/items/path
   Adicionar item a subpasta profunda
   ============================================================ */
router.post("/items/path", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await WorkspaceHandlers.addItemToPath(userId, req.body);

    res.json({ success: true, data: result });

  } catch (error) {
    logger.error("Erro ao criar item por caminho:", error);
    next(error);
  }
});

/* ============================================================
   DELETE pasta
   ============================================================ */
router.delete("/folders/:id", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) return res.status(404).json({ success: false, message: "Pasta não encontrada" });

    await prisma.folder.delete({ where: { id } });
    cacheManager.delete(`cache:${userId}:/api/workspace/folders`);

    res.json({ success: true, message: `Pasta "${folder.name}" deletada` });

  } catch (error) {
    logger.error("Erro ao deletar pasta:", error);
    next(error);
  }
});

/* ============================================================
   DELETE item
   ============================================================ */
router.delete("/items/:id", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const item = await prisma.folderItem.findFirst({ where: { id, userId } });
    if (!item) return res.status(404).json({ success: false, message: "Item não encontrado" });

    await prisma.folderItem.delete({ where: { id } });

    cacheManager.delete(`cache:${userId}:/api/workspace/items`);
    res.json({ success: true, message: "Item deletado com sucesso" });

  } catch (error) {
    logger.error("Erro ao deletar item:", error);
    next(error);
  }
});

/* ============================================================
   /stats
   ============================================================ */
router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const [totalFolders, totalItems, itemsByType] = await Promise.all([
      prisma.folder.count({ where: { userId } }),
      prisma.folderItem.count({ where: { userId } }),
      prisma.folderItem.groupBy({
        by: ["itemType"],
        where: { userId },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        totalFolders,
        totalItems,
        itemsByType: itemsByType.map(i => ({
          type: i.itemType || "sem_tipo",
          count: i._count
        }))
      }
    });

  } catch (error) {
    logger.error("Erro nas estatísticas:", error);
    next(error);
  }
});

export default router;
