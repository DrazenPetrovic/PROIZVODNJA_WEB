// Šifre usklađene sa kolonom vrsta_radnika (vidi public/vrstaRadnika.txt)
export const VRSTE_RADNIKA: Record<number, string> = {
  0:  'Ostalo',
  1:  'Vlasnik',
  2:  'Komercijala',
  3:  'Kancelarija',
  4:  'Proizvodnja kesa',
  5:  'Proizvodnja kutija',
  6:  'Magacin',
  7:  'Vozač',
  10: 'Spoljni saradnik',
};

export const VRSTA_VLASNIK = 1;
export const VRSTA_PROIZVODNJA_KUTIJA = 5;

export function getNazivVrste(vrsta: number): string {
  return VRSTE_RADNIKA[vrsta] ?? 'Nedefinisano';
}
