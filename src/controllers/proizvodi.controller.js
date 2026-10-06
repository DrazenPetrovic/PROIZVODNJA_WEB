import * as ProizvodiService from '../services/proizvodi.service.js';

export const pregledProizvodaKese = async (req, res) => {
  try {
    const result = await ProizvodiService.pregledProizvodaKese();
    return res.json(result);
  } catch (error) {
    console.error('pregledProizvodaKese error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};
