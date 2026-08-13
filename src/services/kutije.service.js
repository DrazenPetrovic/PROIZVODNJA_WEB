import { withConnection } from './db.service.js';

export const pregledNarucenihKutija = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.sp_pregled_narucenih_kutija()'
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};

export const pregledStampeProizvodaPotvrda = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.sp_pregled_stampe_proizvoda_potvrda()'
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};

export const pregledIzmjenaNarucenihKutija = async (sifraTerenaDostava) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.sp_kutije_narucene_izmjene_podataka_pregled(?)',
      [JSON.stringify(sifraTerenaDostava)]
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};

export const unosStampaProizvodaPotvrda = async (params) => {
  const {
    sifra_tabele, sifra_terena_dostava, sifra_partnera, naziv_partnera,
    sifra_proizvoda, naziv_proizvoda, napomena, kolicina_proizvoda,
    datum_spremno, id_operatera, naziv_operatera, status, napomena_operatera,
  } = params;

  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.sp_unos_stampa_proizvoda_potvrda(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        sifra_tabele, sifra_terena_dostava, sifra_partnera, naziv_partnera ?? '',
        sifra_proizvoda, naziv_proizvoda, napomena ?? '', kolicina_proizvoda,
      ]
    );
    const noviId = rows?.[0]?.[0]?.novi_id ?? null;
    return { success: true, novi_id: noviId };
  });
};
