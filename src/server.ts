import 'dotenv/config';
import express, { Application } from 'express';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import eventRegistrationRoutes from "./routes/eventRegistration.routes";
import errorHandler from './middlewares/error.midd';
import SecurityConfig from './config/security/security.config';
import logger from './config/security/logger.config';
import fileRoutes from './routes/file.routes';
import workspaceRoutes from "./routes/workspace.routes";
import authMiddleware from './middlewares/auth.midd';
import reportRoutes from './routes/report.routes';

const app: Application = express();

SecurityConfig.applyAll(app);
// Log inicial do servidor
console.log("SERVER_STARTING", {
  node: process.version,
  env: process.env.NODE_ENV,
});

// Handlers globais (DEVEM vir ANTES do listen)
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
});

// Aplicar configurações de segurança


app.use(express.json());
app.use(express.urlencoded({ extended: false })); // importante para Twilio


app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use("/api/event", eventRegistrationRoutes);
app.use('/api/files', fileRoutes);
app.use("/api/workspace", authMiddleware, workspaceRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error middleware (sempre por último)
app.use(errorHandler);
//
// Porta do Render
const PORT = process.env.PORT || 3000;
//
app.listen(PORT, () => {
  logger.info(
    `🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`
  );
});
