import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as ProizvodiController from '../controllers/proizvodi.controller.js';

const router = Router();

router.get('/kese', verifyToken, ProizvodiController.pregledProizvodaKese);

export default router;
