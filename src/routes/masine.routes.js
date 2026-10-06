import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as MasineController from '../controllers/masine.controller.js';

const router = Router();

router.get('/pregled', verifyToken, MasineController.pregledMasina);

export default router;
