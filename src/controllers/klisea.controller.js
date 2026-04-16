import * as KliseaService from '../services/klisea.service.js';

export const pregledKreiranihKlisea = async (req, res) => {
  try {
    const result = await KliseaService.pregledKreiranihKlisea();
    return res.json(result);
  } catch (error) {
    console.error('pregledKreiranihKlisea error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};

export const zaduzivanjeKlisea = async (req, res) => {
  try {
    const { sifraTabele, napomenaRadnika, dimenzije, ladica } = req.body;

    if (sifraTabele === undefined || sifraTabele === null) {
      return res.status(400).json({
        success: false,
        message: 'Šifra tabele je obavezna',
      });
    }

    let result;
    try {
      result = await KliseaService.zaduzivanjeKlisea(
        Number(sifraTabele),
        napomenaRadnika ?? '',
        dimenzije ?? '',
        Number(ladica ?? 0)
      );
    } catch (dbError) {
      console.error('DB error — sp_zaduzivanje_klisea:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Baza podataka nije dostupna.',
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('zaduzivanjeKlisea error:', error);
    return res.status(500).json({
      success: false,
      message: 'Greška pri obradi zahtjeva',
    });
  }
};
