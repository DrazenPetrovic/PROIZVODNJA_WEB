import { withConnection } from './db.service.js';

export const pregledProizvodaKese = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.proivodi_kese_pregled()'
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};
