"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMiddleware = void 0;
const cache_config_1 = __importDefault(require("../config/security/cache.config"));
const cacheMiddleware = (ttl) => {
    return (req, res, next) => {
        // Apenas cachear requisições GET
        if (req.method !== 'GET') {
            next();
            return;
        }
        const key = `cache:${req.user?.id}:${req.originalUrl}`;
        const cachedData = cache_config_1.default.get(key);
        if (cachedData) {
            res.setHeader('X-Cache', 'HIT');
            res.json(cachedData);
            return;
        }
        // Interceptar o método json para cachear a resposta
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            cache_config_1.default.set(key, data, ttl);
            res.setHeader('X-Cache', 'MISS');
            return originalJson(data);
        };
        next();
    };
};
exports.cacheMiddleware = cacheMiddleware;
