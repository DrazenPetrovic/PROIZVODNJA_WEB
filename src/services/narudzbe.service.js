import { withConnection } from './db.service.js';

export const pregledNarudzbiPapirnihKesa = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.narudzbe_papirnih_kesa_pregled()'
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};

// Jedan proizvod = jedna narudžba
export const unosNarudzbePapirnihKesa = async (params) => {
  const {
    sifra_proizvoda, kolicina, stampa, vrsta_stampe, napomena, dimenzija,
    datum_unosa_narudzbe, narudzba_zavrsena, dodjeljna_masini_na_rad, uradjeno,
    dodatna_stampa, lokacija_klisea, barkod_proizvoda, broj_narudzbe_klijenta,
  } = params;

  const brojKlijenta = String(broj_narudzbe_klijenta ?? '').trim().slice(0, 254);

  const payload = {
    sifra_proizvoda,
    kolicina,
    stampa:                  stampa ? 1 : 0,
    vrsta_stampe:            vrsta_stampe ?? '',
    napomena:                napomena ?? '',
    dimenzija:               dimenzija ?? null,
    datum_unosa_narudzbe:    datum_unosa_narudzbe ?? null,
    narudzba_zavrsena:       narudzba_zavrsena ? 1 : 0,
    dodjeljna_masini_na_rad: dodjeljna_masini_na_rad ?? null,
    uradjeno:                uradjeno ?? 0,
    dodatna_stampa:          dodatna_stampa ?? '',
    lokacija_klisea:         lokacija_klisea ?? null,
    barkod_proizvoda:        barkod_proizvoda ?? '',
    broj_narudzbe_klijenta:  brojKlijenta || '-',
  };

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.narudzbe_papirnih_kesa_unos(?)',
      [JSON.stringify(payload)]
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};
