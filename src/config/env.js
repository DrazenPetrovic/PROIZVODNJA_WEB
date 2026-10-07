import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3004,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5174',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  // Folder za PDF dizajne klijenata (na Ubuntu: /srv/proizvodnja/dizajni)
  DIZAJNI_DIR: process.env.DIZAJNI_DIR || './uploads/dizajni',
  DIZAJNI_MAX_MB: Number(process.env.DIZAJNI_MAX_MB || 20),
};
