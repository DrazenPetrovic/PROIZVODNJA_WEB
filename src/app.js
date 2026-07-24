import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import kliseaRoutes from './routes/klisea.routes.js';
import kutijeRoutes from './routes/kutije.routes.js';

export const createApp = () => {
  const app = express();

  const localhostDevOrigin = /^http:\/\/localhost:\d+$/;

  app.use(
    cors({
      origin:
        env.NODE_ENV === 'production'
          ? env.FRONTEND_URL
          : [env.FRONTEND_URL, localhostDevOrigin],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/klise-zaduzivanje', kliseaRoutes);
  app.use('/api/kutije', kutijeRoutes);

  return app;
};
