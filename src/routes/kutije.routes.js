import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as KutijeController from '../controllers/kutije.controller.js';

const router = Router();

router.get('/pregled',   verifyToken, KutijeController.pregledNarucenihKutija);
router.get('/zavrseno',  verifyToken, KutijeController.pregledStampeProizvodaPotvrda);
router.post('/potvrda',  verifyToken, KutijeController.unosStampaProizvodaPotvrda);

export default router;
