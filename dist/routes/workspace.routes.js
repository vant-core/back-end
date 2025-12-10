"use strict";
// src/routes/workspace.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const logger_config_1 = __importDefault(require("../config/security/logger.config"));
const cache_config_1 = __importDefault(require("../config/security/cache.config"));
const router = (0, express_1.Router)();
/**
 * 🔥 GET /api/workspace/folders
 * Lista todas as pastas do usuário com contagem de items
 */
router.get("/folders", async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Busca pastas com contagem de items
        const folders = await database_1.default.folder.findMany({
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
        logger_config_1.default.info(`Pastas listadas para usuário ${userId}`);
    }
    catch (error) {
        logger_config_1.default.error("Erro ao listar pastas:", error);
        next(error);
    }
});
/**
 * 🔥 GET /api/workspace/folders/:id
 * Busca uma pasta específica com seus items
 */
router.get("/folders/:id", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const folder = await database_1.default.folder.findFirst({
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
    }
    catch (error) {
        logger_config_1.default.error("Erro ao buscar pasta:", error);
        next(error);
    }
});
/**
 * 🔥 GET /api/workspace/items
 * Lista todos os items do usuário (com filtros opcionais)
 */
router.get("/items", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { folderId, itemType, search } = req.query;
        const whereClause = { userId };
        if (folderId) {
            whereClause.folderId = folderId;
        }
        if (itemType) {
            whereClause.itemType = itemType;
        }
        let items = await database_1.default.folderItem.findMany({
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
    }
    catch (error) {
        logger_config_1.default.error("Erro ao listar items:", error);
        next(error);
    }
});
/**
 * 🔥 GET /api/workspace/items/:id
 * Busca um item específico
 */
router.get("/items/:id", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const item = await database_1.default.folderItem.findFirst({
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
    }
    catch (error) {
        logger_config_1.default.error("Erro ao buscar item:", error);
        next(error);
    }
});
/**
 * 🔥 DELETE /api/workspace/folders/:id
 * Deleta uma pasta (e seus items via cascade)
 */
router.delete("/folders/:id", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const folder = await database_1.default.folder.findFirst({
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
        await database_1.default.folder.delete({
            where: { id }
        });
        // Limpa cache
        cache_config_1.default.delete(`cache:${userId}:/api/workspace/folders`);
        res.json({
            success: true,
            message: `Pasta "${folder.name}" deletada com sucesso`
        });
        logger_config_1.default.info(`Pasta ${id} deletada pelo usuário ${userId}`);
    }
    catch (error) {
        logger_config_1.default.error("Erro ao deletar pasta:", error);
        next(error);
    }
});
/**
 * 🔥 DELETE /api/workspace/items/:id
 * Deleta um item específico
 */
router.delete("/items/:id", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const item = await database_1.default.folderItem.findFirst({
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
        await database_1.default.folderItem.delete({
            where: { id }
        });
        // Limpa cache
        cache_config_1.default.delete(`cache:${userId}:/api/workspace/items`);
        res.json({
            success: true,
            message: "Item deletado com sucesso"
        });
        logger_config_1.default.info(`Item ${id} deletado pelo usuário ${userId}`);
    }
    catch (error) {
        logger_config_1.default.error("Erro ao deletar item:", error);
        next(error);
    }
});
/**
 * 🔥 GET /api/workspace/stats
 * Estatísticas do workspace do usuário
 */
router.get("/stats", async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [totalFolders, totalItems, itemsByType] = await Promise.all([
            database_1.default.folder.count({ where: { userId } }),
            database_1.default.folderItem.count({ where: { userId } }),
            database_1.default.folderItem.groupBy({
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
    }
    catch (error) {
        logger_config_1.default.error("Erro ao buscar estatísticas:", error);
        next(error);
    }
});
exports.default = router;
