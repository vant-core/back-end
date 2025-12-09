import 'dotenv/config';
import express, { Application } from 'express';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import eventRegistrationRoutes from "./routes/eventRegistration.routes";
import errorHandler from './middlewares/error.midd';
import SecurityConfig from './config/security/security.config';
import logger from './config/security/logger.config';

const app: Application = express();

// Aplicar todas as configurações de segurança
SecurityConfig.applyAll(app);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

app.use("/api/event", eventRegistrationRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error Handler (deve ser o último middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});