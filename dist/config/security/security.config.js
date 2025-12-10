"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const logger_config_1 = __importDefault(require("./logger.config"));
class SecurityConfig {
    // Configuração do Helmet - Proteção de Headers HTTP
    static configureHelmet(app) {
        app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'", 'https://api.openai.com'],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: true,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            dnsPrefetchControl: true,
            frameguard: { action: 'deny' },
            hidePoweredBy: true,
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            ieNoOpen: true,
            noSniff: true,
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
            xssFilter: true,
        }));
    }
    // Configuração do CORS
    static configureCORS(app) {
        const defaultOrigins = [
            'http://localhost:3001',
            'https://front-vant.vercel.app'
        ];
        const envOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : [];
        const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];
        logger_config_1.default.info('CORS allowed origins:', allowedOrigins);
        app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                logger_config_1.default.info(`CORS request from origin: ${origin}`);
                // Permitir requisições sem origin (Postman, curl, etc)
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.includes(origin) ||
                    process.env.NODE_ENV === 'development') {
                    return callback(null, true);
                }
                logger_config_1.default.warn(`Origem bloqueada pelo CORS: ${origin}`);
                return callback(new Error('Origem não permitida pelo CORS'));
            },
            credentials: true, // para cookies / Authorization
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'X-API-Key',
                'X-Request-ID'
            ],
            exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
            maxAge: 86400
        }));
    }
    // Rate Limiting Global
    static configureRateLimit(app) {
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
            message: {
                success: false,
                message: 'Muitas requisições deste IP, tente novamente mais tarde.',
                retryAfter: '15 minutos'
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESS === 'true',
            handler: (req, res) => {
                logger_config_1.default.warn(`Rate limit excedido: ${req.ip}`);
                res.status(429).json({
                    success: false,
                    message: 'Muitas requisições. Tente novamente mais tarde.',
                });
            },
        });
        app.use(limiter);
    }
    // Proteção contra NoSQL Injection
    static configureSanitization(app) {
        app.use((0, express_mongo_sanitize_1.default)({
            replaceWith: '_',
            onSanitize: ({ req, key }) => {
                logger_config_1.default.warn(`Tentativa de injection detectada: ${key} em ${req.ip}`);
            },
        }));
    }
    // Proteção contra HTTP Parameter Pollution
    static configureHPP(app) {
        app.use((0, hpp_1.default)({
            whitelist: ['conversationId', 'limit', 'page', 'sort'],
        }));
    }
    // Compressão de resposta
    static configureCompression(app) {
        app.use((0, compression_1.default)({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression_1.default.filter(req, res);
            },
            level: 6,
            threshold: 1024,
        }));
    }
    // Limite de tamanho de payload
    static configureBodyParser(app) {
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    }
    // Request ID para rastreamento
    static configureRequestId(app) {
        app.use((req, res, next) => {
            const requestId = req.headers['x-request-id'] ||
                `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            req.headers['x-request-id'] = requestId;
            res.setHeader('X-Request-ID', requestId);
            next();
        });
    }
    // Timeout de requisições
    static configureTimeout(app) {
        app.use((req, res, next) => {
            const timeout = setTimeout(() => {
                if (!res.headersSent) {
                    logger_config_1.default.error(`Request timeout: ${req.method} ${req.path}`);
                    res.status(408).json({
                        success: false,
                        message: 'Tempo de requisição excedido',
                    });
                }
            }, 30000); // 30 segundos
            res.on('finish', () => clearTimeout(timeout));
            next();
        });
    }
    // Bloqueio de rotas não existentes
    static configureNotFound(app) {
        app.use((req, res) => {
            logger_config_1.default.warn(`Rota não encontrada: ${req.method} ${req.path} - IP: ${req.ip}`);
            res.status(404).json({
                success: false,
                message: 'Rota não encontrada',
                path: req.path,
            });
        });
    }
    // Headers de segurança customizados
    static configureCustomHeaders(app) {
        app.use((_req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
            res.removeHeader('X-Powered-By');
            next();
        });
    }
    // Logging de requisições suspeitas
    static configureSuspiciousActivityLogger(app) {
        app.use((req, _res, next) => {
            const suspiciousPatterns = [
                /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i,
                /(union.*select|insert.*into|drop.*table)/i,
                /(<script|javascript:|onerror=)/i,
                /(\.\.\/|\.\.\\)/,
            ];
            const url = req.originalUrl || req.url;
            const body = JSON.stringify(req.body);
            suspiciousPatterns.forEach((pattern) => {
                if (pattern.test(url) || pattern.test(body)) {
                    logger_config_1.default.warn('Atividade suspeita detectada:', {
                        ip: req.ip,
                        method: req.method,
                        path: req.path,
                        userAgent: req.headers['user-agent'],
                    });
                }
            });
            next();
        });
    }
    // Cache Control para rotas específicas
    static configureCacheControl(app) {
        app.use((req, res, next) => {
            // Rotas que não devem ser cacheadas
            if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/ai')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
            else {
                // Rotas públicas podem ter cache
                res.setHeader('Cache-Control', 'public, max-age=300');
            }
            next();
        });
    }
    // HATEOAS - Adiciona links de navegação nas respostas
    static addHATEOASLinks(data, req, resourceType) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const links = {
            self: `${baseUrl}${req.originalUrl}`,
        };
        if (resourceType === 'conversation') {
            links.messages = `${baseUrl}/api/ai/conversations/${data.id}`;
            links.delete = `${baseUrl}/api/ai/conversations/${data.id}`;
        }
        if (resourceType === 'conversations') {
            links.create = `${baseUrl}/api/ai/chat`;
        }
        if (resourceType === 'user') {
            links.conversations = `${baseUrl}/api/ai/conversations`;
            links.profile = `${baseUrl}/api/auth/me`;
        }
        return {
            ...data,
            _links: links,
        };
    }
    // Aplicar todas as configurações de segurança
    static applyAll(app) {
        logger_config_1.default.info('🔒 Aplicando configurações de segurança...');
        this.configureCustomHeaders(app);
        this.configureHelmet(app);
        this.configureCORS(app);
        this.configureBodyParser(app);
        this.configureSanitization(app);
        this.configureHPP(app);
        this.configureCompression(app);
        this.configureRequestId(app);
        this.configureRateLimit(app);
        this.configureSuspiciousActivityLogger(app);
        this.configureCacheControl(app);
        this.configureTimeout(app);
        logger_config_1.default.info('✅ Configurações de segurança aplicadas com sucesso');
    }
}
// Rate Limiting para autenticação (mais restritivo)
SecurityConfig.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    },
    skipSuccessfulRequests: true,
});
// Rate Limiting para IA (prevenir abuso)
SecurityConfig.aiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 mensagens por minuto
    message: {
        success: false,
        message: 'Muitas mensagens enviadas. Aguarde um momento.',
    },
});
exports.default = SecurityConfig;
