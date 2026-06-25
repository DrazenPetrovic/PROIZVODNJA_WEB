export const VRSTE_RADNIKA: Record<number, string> = {
  [-1]: 'Osnivač',
  0:    'Ne zaposlen',
  1:    'Direktor',
  2:    'Komercijalista',
  3:    'Finansije',
  4:    'Vozač',
  5:    'Operater',
  6:    'Magacioner',
  7:    'Operater kutije',
  8:    'Nedefinisano',
  9:    'Nedefinisano',
  10:   'Nedefinisano',
  11:   'Nedefinisano',
  12:   'Nedefinisano',
  13:   'Nedefinisano',
  14:   'Nedefinisano',
  15:   'Nedefinisano',
  16:   'Nedefinisano',
  17:   'Nedefinisano',
  18:   'Nedefinisano',
  19:   'Nedefinisano',
  20:   'Nedefinisano',
};

export function getNazivVrste(vrsta: number): string {
  return VRSTE_RADNIKA[vrsta] ?? 'Nedefinisano';
}
