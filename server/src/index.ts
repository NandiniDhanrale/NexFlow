import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDatabase } from './config/database';
import { initRedis } from './config/redis';
import { initSocketIO } from './sockets';
import { initQueueSystem } from './queues';
import { loadSchedules } from './scheduler';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { metricsMiddleware } from './middleware/metrics';
import authRoutes from './routes/auth';
import workflowRoutes from './routes/workflows';
import webhookRoutes from './routes/webhooks';
import executionRoutes from './routes/executions';
import healthRoutes from './routes/health';

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(metricsMiddleware);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/health', healthRoutes);
app.use('/metrics', async (_req, res) => {
  const { register } = await import('prom-client');
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/executions', executionRoutes);

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

async function start() {
  await initDatabase();
  await initRedis();
  const io = initSocketIO(server);
  initQueueSystem(io);
  await loadSchedules();

  server.listen(PORT, () => {
    console.log(`NexFlow API running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
