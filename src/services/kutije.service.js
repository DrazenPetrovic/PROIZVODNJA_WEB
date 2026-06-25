import { withConnection } from './db.service.js';

export const pregledNarucenihKutija = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.sp_pregled_narucenih_kutija()'
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};
