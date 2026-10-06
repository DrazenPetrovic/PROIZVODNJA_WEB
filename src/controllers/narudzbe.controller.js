import * as NarudzbeService from '../services/narudzbe.service.js';

// Lokalno vrijeme servera u formatu 'YYYY-MM-DD HH:mm:ss'
const sadaLokalno = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const brojIliNull = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

// Lokacija klišea: broj ako je broj, inače tekst kako je došao iz baze
const lokacijaIliNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  return Number.isFinite(Number(v)) ? Number(v) : String(v);
};

export const pregledNarudzbiPapirnihKesa = async (req, res) => {
  try {
    const result = await NarudzbeService.pregledNarudzbiPapirnihKesa();
    return res.json(result);
  } catch (error) {
    console.error('pregledNarudzbiPapirnihKesa error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};

export const unosNarudzbePapirnihKesa =async (req, res) => {
  try {
    const {
      sifra_proizvoda, kolicina, stampa, vrsta_stampe, napomena, dimenzija,
      dodjeljna_masini_na_rad, dodatna_stampa, lokacija_klisea, barkod_proizvoda,
      broj_narudzbe_klijenta,
    } = req.body;

    if (
      !sifra_proizvoda ||
      !Number.isInteger(Number(kolicina)) || !(Number(kolicina) > 0) ||
      !dodjeljna_masini_na_rad ||
      dimenzija === undefined || dimenzija === null || dimenzija === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nedostaju obavezna polja (proizvod, količina — cijeli broj, mašina, dimenzija).',
      });
    }

    const result = await NarudzbeService.unosNarudzbePapirnihKesa({
      sifra_proizvoda:      Number(sifra_proizvoda),
      kolicina:             Number(kolicina),
      stampa:               Number(stampa) === 1 || stampa === true ? 1 : 0,
      vrsta_stampe,
      napomena,
      dimenzija:            brojIliNull(dimenzija),
      // Datum unosa generišemo na serveru
      datum_unosa_narudzbe: sadaLokalno(),
      // Nova narudžba — nije završena i ništa još nije urađeno
      narudzba_zavrsena:       0,
      dodjeljna_masini_na_rad: brojIliNull(dodjeljna_masini_na_rad),
      uradjeno:                0,
      dodatna_stampa,
      lokacija_klisea:      lokacijaIliNull(lokacija_klisea),
      barkod_proizvoda,
      broj_narudzbe_klijenta,
    });

    return res.json(result);
  } catch (error) {
    console.error('unosNarudzbePapirnihKesa error:', error);
    return res.status(503).json({ success: false, message: 'Baza podataka nije dostupna.' });
  }
};
