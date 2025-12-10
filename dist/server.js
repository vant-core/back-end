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
// Aplicar todas as configurações de segurança
security_config_1.default.applyAll(app);
// Rotas
app.use('/api/auth', auth_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use("/api/event", eventRegistration_routes_1.default);
app.use('/api/files', file_routes_1.default);
app.use("/api/workspace", auth_midd_1.default, workspace_routes_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// Error Handler (deve ser o último middleware)
app.use(error_midd_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger_config_1.default.info(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});
console.log("SERVER_STARTING", {
    node: process.version,
    env: process.env.NODE_ENV,
});
// Tratamento de erros não capturados
process.on('unhandledRejection', (reason) => {
    logger_config_1.default.error('Unhandled Rejection:', reason);
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger_config_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
