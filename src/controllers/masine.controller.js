import * as MasineService from '../services/masine.service.js';

export const pregledMasina = async (req, res) => {
  try {
    const result = await MasineService.pregledMasina();
    return res.json(result);
  } catch (error) {
    console.error('pregledMasina error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};
