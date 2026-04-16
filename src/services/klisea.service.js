import { withConnection } from './db.service.js';

export const pregledKreiranihKlisea = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL aplikacija_kese.sp_pregled_kreiranih_klisea()'
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};

export const zaduzivanjeKlisea = async (sifraTabele, napomenaRadnika, dimenzije, ladica) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL aplikacija_kese.sp_zaduzivanje_klisea(?, ?, ?, ?)',
      [sifraTabele, napomenaRadnika, dimenzije, ladica]
    );

    const data = rows?.[0] ?? [];
    return { success: true, data };
  });
};
