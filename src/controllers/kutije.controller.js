import * as KutijeService from '../services/kutije.service.js';

export const pregledStampeProizvodaPotvrda = async (req, res) => {
  try {
    const result = await KutijeService.pregledStampeProizvodaPotvrda();
    return res.json(result);
  } catch (error) {
    console.error('pregledStampeProizvodaPotvrda error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};

export const pregledNarucenihKutija = async (req, res) => {
  try {
    const result = await KutijeService.pregledNarucenihKutija();
    return res.json(result);
  } catch (error) {
    console.error('pregledNarucenihKutija error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};

export const unosStampaProizvodaPotvrda = async (req, res) => {
  try {
    const {
      sifra_tabele, sifra_terena_dostava, sifra_partnera, naziv_partnera,
      sifra_proizvoda, naziv_proizvoda, napomena, kolicina_proizvoda,
      id_operatera, naziv_operatera, napomena_operatera,
    } = req.body;

    if (!sifra_tabele || !sifra_proizvoda) {
      return res.status(400).json({ success: false, message: 'Nedostaju obavezna polja.' });
    }

    // Datum unosa generišemo na serveru
    const datum_spremno = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const result = await KutijeService.unosStampaProizvodaPotvrda({
      sifra_tabele:         Number(sifra_tabele),
      sifra_terena_dostava: Number(sifra_terena_dostava ?? 0),
      sifra_partnera:       Number(sifra_partnera ?? 0),
      naziv_partnera,
      sifra_proizvoda:      Number(sifra_proizvoda),
      naziv_proizvoda,
      napomena,
      kolicina_proizvoda:   Number(kolicina_proizvoda),
      datum_spremno,
      id_operatera:         Number(id_operatera ?? 0),
      naziv_operatera,
      status:               1,
      napomena_operatera,
    });

    return res.json(result);
  } catch (error) {
    console.error('unosStampaProizvodaPotvrda error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};
