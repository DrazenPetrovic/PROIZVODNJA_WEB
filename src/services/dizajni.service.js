import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

const ROOT = path.resolve(env.DIZAJNI_DIR);

// Dozvoljeni oblik putanje: 2026-10/1759752000000_naziv.pdf
const MJESEC_RE = /^\d{4}-\d{2}$/;
const FAJL_RE = /^[A-Za-z0-9._+-]+\.pdf$/;

const ocistiNaziv = (naziv) =>
  path.basename(String(naziv || 'dizajn.pdf'))
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // č→c, š→s ...
    .replace(/đ/g, 'dj').replace(/Đ/g, 'Dj')
    .replace(/\.pdf$/i, '')
    .replace(/[^A-Za-z0-9._+-]+/g, '_')
    .replace(/^[._]+/, '')
    .slice(0, 120) || 'dizajn';

export const snimiDizajn = async (buffer, originalniNaziv) => {
  const d = new Date();
  const mjesec = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const fajl = `${Date.now()}_${ocistiNaziv(originalniNaziv)}.pdf`;

  const dir = path.join(ROOT, mjesec);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fajl), buffer, { flag: 'wx' });

  return { putanja: `/api/dizajni/${mjesec}/${fajl}` };
};

// Vraća apsolutnu putanju fajla ili null ako parametri nisu ispravni
export const putanjaDizajna = (mjesec, fajl) => {
  if (!MJESEC_RE.test(mjesec) || !FAJL_RE.test(fajl)) return null;
  const puna = path.join(ROOT, mjesec, fajl);
  return puna.startsWith(ROOT + path.sep) ? puna : null;
};
