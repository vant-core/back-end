"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const eventRegistration_routes_1 = __importDefault(require("./routes/eventRegistration.routes"));
const error_midd_1 = __importDefault(require("./middlewares/error.midd"));
const security_config_1 = __importDefault(require("./config/security/security.config"));
const logger_config_1 = __importDefault(require("./config/security/logger.config"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
const workspace_routes_1 = __importDefault(require("./routes/workspace.routes"));
const auth_midd_1 = __importDefault(require("./middlewares/auth.midd"));
const app = (0, express_1.default)();
// Log inicial do servidor
console.log("SERVER_STARTING", {
    node: process.version,
    env: process.env.NODE_ENV,
});
// Handlers globais (DEVEM vir ANTES do listen)
process.on('unhandledRejection', (reason) => {
    logger_config_1.default.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    logger_config_1.default.error('Uncaught Exception:', error);
});
// Aplicar configurações de segurança
security_config_1.default.applyAll(app);
// Rotas
app.use('/api/auth', auth_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use("/api/event", eventRegistration_routes_1.default);
app.use('/api/files', file_routes_1.default);
app.use("/api/workspace", auth_midd_1.default, workspace_routes_1.default);
// Healthcheck
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// Error middleware (sempre por último)
app.use(error_midd_1.default);
// Porta do Render
const PORT = process.env.PORT || 3000;
//
app.listen(PORT, () => {
    logger_config_1.default.info(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});
