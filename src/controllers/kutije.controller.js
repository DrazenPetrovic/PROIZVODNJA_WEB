import * as KutijeService from '../services/kutije.service.js';

export const pregledNarucenihKutija = async (req, res) => {
  try {
    const result = await KutijeService.pregledNarucenihKutija();
    return res.json(result);
  } catch (error) {
    console.error('pregledNarucenihKutija error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};
