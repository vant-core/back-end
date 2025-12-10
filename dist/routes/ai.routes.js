"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = __importDefault(require("../controllers/ai.controller"));
const auth_midd_1 = __importDefault(require("../middlewares/auth.midd"));
const security_config_1 = __importDefault(require("../config/security/security.config"));
const cache_midd_1 = require("../middlewares/cache.midd");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.post('/chat', auth_midd_1.default, security_config_1.default.aiRateLimiter, validators_1.validateAIMessage, validators_1.handleValidationErrors, ai_controller_1.default.chat);
router.get('/conversations', auth_midd_1.default, (0, cache_midd_1.cacheMiddleware)(300000), // Cache de 5 minutos
ai_controller_1.default.getConversations);
router.get('/conversations/:id', auth_midd_1.default, (0, cache_midd_1.cacheMiddleware)(300000), ai_controller_1.default.getConversation);
router.delete('/conversations/:id', auth_midd_1.default, ai_controller_1.default.deleteConversation);
exports.default = router;
