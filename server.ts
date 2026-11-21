import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { initializeDatabase } from './server/db/database';
import { verifyCookieMutationOrigin } from './server/utils/auth';
import { authRouter } from './server/routes/auth';
import { studentRouter } from './server/routes/student';
import { teacherRouter } from './server/routes/teacher';

dotenv.config();

async function startServer() {
  initializeDatabase();

  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use(verifyCookieMutationOrigin);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'adaptix-api' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/student', studentRouter);
  app.use('/api/teacher', teacherRouter);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ADAPTIX server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ADAPTIX server:', err);
  process.exit(1);
});
