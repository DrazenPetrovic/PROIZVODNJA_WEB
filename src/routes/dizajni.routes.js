import express, { Router } from 'express';
import { env } from '../config/env.js';
import { verifyToken, requireVlasnik } from '../middleware/auth.js';
import * as DizajniController from '../controllers/dizajni.controller.js';

const router = Router();

// Upload: tijelo zahtjeva je sam PDF, originalni naziv ide u ?naziv=
router.post(
  '/',
  verifyToken,
  requireVlasnik,
  express.raw({ type: 'application/pdf', limit: `${env.DIZAJNI_MAX_MB}mb` }),
  DizajniController.uploadDizajna
);

// Pregled: svaki prijavljeni korisnik
router.get('/:mjesec/:fajl', verifyToken, DizajniController.prikazDizajna);

export default router;
