import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as KliseaController from '../controllers/klisea.controller.js';

const router = Router();

router.get('/pregled',     verifyToken, KliseaController.pregledKreiranihKlisea);
router.post('/zaduzivanje', verifyToken, KliseaController.zaduzivanjeKlisea);

export default router;
