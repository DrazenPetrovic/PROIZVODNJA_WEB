import { Router } from 'express';
import { verifyToken, requireVlasnik } from '../middleware/auth.js';
import * as NarudzbeController from '../controllers/narudzbe.controller.js';

const router = Router();

router.get('/papirne-kese',  verifyToken, requireVlasnik, NarudzbeController.pregledNarudzbiPapirnihKesa);
router.post('/papirne-kese', verifyToken, requireVlasnik, NarudzbeController.unosNarudzbePapirnihKesa);

export default router;
