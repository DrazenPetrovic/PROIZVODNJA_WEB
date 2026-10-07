import fs from 'fs';
import * as DizajniService from '../services/dizajni.service.js';

export const uploadDizajna = async (req, res) => {
  try {
    const buffer = req.body;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'Fajl nije poslan.' });
    }
    // Provjera da je stvarno PDF (svaki PDF počinje sa %PDF-)
    if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return res.status(400).json({ success: false, message: 'Dozvoljen je samo PDF fajl.' });
    }

    const result = await DizajniService.snimiDizajn(buffer, req.query.naziv);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('uploadDizajna error:', error);
    return res.status(500).json({ success: false, message: 'Greška pri snimanju fajla.' });
  }
};

export const prikazDizajna = (req, res) => {
  const puna = DizajniService.putanjaDizajna(req.params.mjesec, req.params.fajl);
  if (!puna || !fs.existsSync(puna)) {
    return res.status(404).json({ success: false, message: 'Fajl ne postoji.' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${req.params.fajl}"`);
  return res.sendFile(puna);
};
