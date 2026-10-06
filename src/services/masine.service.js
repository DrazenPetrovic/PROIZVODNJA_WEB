import { withConnection } from './db.service.js';

export const pregledMasina = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      'CALL erp_proizvodnja.masine_pregled()'
    );
    return { success: true, data: rows?.[0] ?? [] };
  });
};
