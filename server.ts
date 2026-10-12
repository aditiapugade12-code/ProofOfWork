import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import { initDatabase } from './server/db.ts';
import { seedDatabase } from './server/seed.ts';
import authRoutes from './server/routes/auth.ts';
import adminRoutes from './server/routes/admin.ts';
import evaluatorRoutes from './server/routes/evaluator.ts';
import studentRoutes from './server/routes/student.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize DB and Seed baseline accounts idempotently
  await initDatabase();
  await seedDatabase(true);

  // Core Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // API Route Mounts
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/evaluator', evaluatorRoutes);
  app.use('/api/student', studentRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      platform: 'ProofOfWork',
      timestamp: new Date().toISOString(),
    });
  });

  // Client Routing (Dev via Vite middlewares, Prod via dist static)
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ProofOfWork] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ProofOfWork] Fatal server startup error:', err);
  process.exit(1);
});
