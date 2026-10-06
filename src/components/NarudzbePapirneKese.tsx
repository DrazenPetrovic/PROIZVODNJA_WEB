import { useState, useEffect, useRef, useMemo } from "react";
import { theme } from "../theme";
import {
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShoppingCart,
  MousePointerClick,
  Loader2,
  Search,
  Paperclip,
  Factory,
} from "lucide-react";

const PRIMARY = theme.primary;
const SECONDARY = theme.secondary;
const SEL_BG = "#dcfce7";
const SEL_BORDER = "#16a34a";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3004";

// ════════════════════════════════════════════════════════════════════
//  Kolone koje vraća erp_proizvodnja.proivodi_kese_pregled()
// ════════════════════════════════════════════════════════════════════
type Proizvod = Record<string, unknown>;

const POLJE = {
  sifra:  "sifra_proizvoda",   // jedinstvena šifra proizvoda (šalje se u narudžbu)
  naziv:  "naziv_proizvoda",
  jm:     "jm",
};

// Kolone tabele proizvoda (key = naziv kolone iz procedure)
const KOLONE_TABELE: { key: string; label: string; mono?: boolean }[] = [
  { key: POLJE.sifra, label: "Šifra", mono: true },
  { key: POLJE.naziv, label: "Naziv proizvoda" },
  { key: POLJE.jm,    label: "JM" },
];
// ════════════════════════════════════════════════════════════════════

// Mrežna mapa s PDF dizajnima klijenata. Preglednik ne daje punu putanju izabranog
// fajla (samo naziv), pa se putanja slaže kao MAPA_DIZAJNA + naziv fajla.
const MAPA_DIZAJNA = "\\\\172.16.20.200\\Aplikacije\\Kese_deklaracija\\";

const vrijednost = (p: Proizvod, key: string): string => {
  const v = p[key];
  return v === null || v === undefined ? "" : String(v);
};

interface KliseLokacija {
  sifra: number;
  sifra_artikla: number | string;
  naziv_stampe: string;
  lokacija: number | string;
}

interface Masina {
  sifra_masine: number;
  naziv_masine: string;
}

// ════════════════════════════════════════════════════════════════════
//  Narudžbe u proizvodnji — erp_proizvodnja.narudzbe_papirnih_kesa_pregled()
//  Za svako polje se uzima prva kolona iz liste koja ima vrijednost.
// ════════════════════════════════════════════════════════════════════
type Narudzba = Record<string, unknown>;

const KOLONA_STATUSA = "narudzba_zavrsena";
const STATUS_U_PROIZVODNJI = 1;

const NARUDZBA_POLJA = {
  id:       ["sifra_narudzbe"],
  naziv:    ["naziv_proizvoda", "sifra_proizvoda"],
  kolicina: ["kolicina"],
  uradjeno: ["uradjeno"],
  jm:       ["jm"],
  masina:   ["naziv_masine", "dodjeljna_masini_na_rad"],
  klijent:  ["broj_narudzbe_klijenta"],
  datum:    ["datum_unosa_narudzbe"],
  dimenzija:["dimenzija"],
  napomena: ["napomena"],
};

const polje = (r: Narudzba, kljucevi: string[]): string => {
  for (const k of kljucevi) {
    const v = r[k];
    if (v !== null && v !== undefined && v !== "") return String(v);
  }
  return "";
};

const formatDatum = (v: string): string => {
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}. ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Prijedlog dimenzije: prve dvije cifre prvog broja u nazivu
// npr. "BIJELA k.100+50x450" → "10"
const dimenzijaIzNaziva = (naziv: string): string =>
  naziv.match(/\d+/)?.[0].slice(0, 2) ?? "";

type ModalStatus = "loading" | "success" | "error";

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none transition-all text-gray-800 placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
    {children}
  </label>
);

const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = SECONDARY),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.target.style.borderColor = "rgb(229 231 235)"),
};

export default function NarudzbePapirneKese() {
  const [proizvodi, setProizvodi] = useState<Proizvod[]>([]);
  const [loadingProizvodi, setLoadingProizvodi] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pretraga, setPretraga] = useState("");
  const [odabrani, setOdabrani] = useState<Proizvod | null>(null);
  const [hoveredSifra, setHoveredSifra] = useState<string | null>(null);
  const [masine, setMasine] = useState<Masina[]>([]);
  const [masineError, setMasineError] = useState("");
  const [narudzbe, setNarudzbe] = useState<Narudzba[]>([]);
  const [loadingNarudzbe, setLoadingNarudzbe] = useState(true);
  const [narudzbeError, setNarudzbeError] = useState("");
  const [klise, setKlise] = useState<KliseLokacija[]>([]);
  const [kliseError, setKliseError] = useState("");

  // Polja narudžbe
  const [brNarudzbeKlijenta, setBrNarudzbeKlijenta] = useState("");
  const [kolicina, setKolicina] = useState("");
  const [masina, setMasina] = useState("");
  const [stampa, setStampa] = useState(false);
  const [vrstaStampe, setVrstaStampe] = useState("");
  const [dodatnaStampa, setDodatnaStampa] = useState("");
  const [dimenzija, setDimenzija] = useState("");
  const [odabraniKlise, setOdabraniKlise] = useState(""); // sifra iz klise_lokacije_pregled
  const [barkod, setBarkod] = useState("");
  const [napomena, setNapomena] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [potvrdaOpen, setPotvrdaOpen] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStatus>("loading");
  const [modalMessage, setModalMessage] = useState("");
  const [modalProgress, setModalProgress] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfIzbor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fajl = e.target.files?.[0];
    if (fajl) setDodatnaStampa(MAPA_DIZAJNA + fajl.name);
    e.target.value = ""; // da se isti fajl može ponovo izabrati
  };

  const ucitajProizvode = async () => {
    setLoadingProizvodi(true);
    setLoadError("");
    try {
      const res = await fetch(`${API_URL}/api/proizvodi/kese`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        setLoadError(data.message || "Greška pri učitavanju");
      else setProizvodi(data.data);
    } catch {
      setLoadError("Greška pri povezivanju sa serverom");
    } finally {
      setLoadingProizvodi(false);
    }
  };

  const ucitajMasine = async () => {
    setMasineError("");
    try {
      const res = await fetch(`${API_URL}/api/masine/pregled`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        setMasineError(data.message || "Greška pri učitavanju mašina");
      else setMasine(data.data);
    } catch {
      setMasineError("Greška pri učitavanju mašina");
    }
  };

  const ucitajKlise = async () => {
    setKliseError("");
    try {
      const res = await fetch(`${API_URL}/api/klise-zaduzivanje/lokacije`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        setKliseError(data.message || "Greška pri učitavanju lokacija klišea");
      else setKlise(data.data);
    } catch {
      setKliseError("Greška pri učitavanju lokacija klišea");
    }
  };

  const ucitajNarudzbe = async () => {
    setLoadingNarudzbe(true);
    setNarudzbeError("");
    try {
      const res = await fetch(`${API_URL}/api/narudzbe/papirne-kese`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        setNarudzbeError(data.message || "Greška pri učitavanju narudžbi");
      else setNarudzbe(data.data);
    } catch {
      setNarudzbeError("Greška pri povezivanju sa serverom");
    } finally {
      setLoadingNarudzbe(false);
    }
  };

  useEffect(() => {
    ucitajProizvode();
    ucitajMasine();
    ucitajKlise();
    ucitajNarudzbe();
  }, []);

  const nemaStatusa = narudzbe.length > 0 && !(KOLONA_STATUSA in narudzbe[0]);
  const uProizvodnji = narudzbe.filter(
    (n) => Number(n[KOLONA_STATUSA]) === STATUS_U_PROIZVODNJI
  );

  // Klišei za odabrani proizvod idu na vrh liste
  const sifraOdabranog = odabrani ? vrijednost(odabrani, POLJE.sifra) : "";
  const kliseZaProizvod = klise.filter((k) => String(k.sifra_artikla) === sifraOdabranog);
  const kliseOstali = klise.filter((k) => String(k.sifra_artikla) !== sifraOdabranog);
  const odabraniKliseRed = klise.find((k) => String(k.sifra) === odabraniKlise);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const filtrirani = useMemo(() => {
    const q = pretraga.trim().toLowerCase();
    if (!q) return proizvodi;
    return proizvodi.filter((p) =>
      KOLONE_TABELE.some((k) => vrijednost(p, k.key).toLowerCase().includes(q))
    );
  }, [proizvodi, pretraga]);

  const openModal = (status: ModalStatus, message: string) => {
    setModalStatus(status);
    setModalMessage(message);
    setModalProgress(0);
    setModalOpen(true);

    if (status === "loading") return;

    requestAnimationFrame(() => setModalProgress(100));
    closeTimer.current = setTimeout(() => setModalOpen(false), 3300);
  };

  const handleCloseModal = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setModalOpen(false);
  };

  const resetForma = () => {
    setBrNarudzbeKlijenta("");
    setKolicina("");
    setMasina("");
    setStampa(false);
    setVrstaStampe("");
    setDodatnaStampa("");
    setDimenzija("");
    setOdabraniKlise("");
    setBarkod("");
    setNapomena("");
  };

  const handleSelect = (p: Proizvod) => {
    setOdabrani(p);
    resetForma();
    setDimenzija(dimenzijaIzNaziva(vrijednost(p, POLJE.naziv)));
  };

  const handleCancel = () => {
    setOdabrani(null);
    resetForma();
  };

  // Obavezno: količina, mašina, dimenzija
  const nedostaje: string[] = [];
  if (!(Number(kolicina) > 0)) nedostaje.push("količina");
  if (!masina) nedostaje.push("mašina");
  if (!dimenzija.trim()) nedostaje.push("dimenzija");
  const formaOk = nedostaje.length === 0;

  const nazivMasine = masine.find((m) => String(m.sifra_masine) === masina)?.naziv_masine ?? "";

  // Submit forme samo otvara modal za potvrdu
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!odabrani || !formaOk) return;
    setPotvrdaOpen(true);
  };

  const posaljiNarudzbu = async () => {
    if (!odabrani || !formaOk) return;
    setPotvrdaOpen(false);
    setSubmitting(true);
    openModal("loading", "");

    try {
      const res = await fetch(`${API_URL}/api/narudzbe/papirne-kese`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sifra_proizvoda:  Number(vrijednost(odabrani, POLJE.sifra)),
          broj_narudzbe_klijenta: brNarudzbeKlijenta.trim(),
          kolicina:         Number(kolicina),
          dodjeljna_masini_na_rad: Number(masina),
          stampa:          stampa ? 1 : 0,
          vrsta_stampe:     stampa ? vrstaStampe.trim() : "",
          dodatna_stampa:   stampa ? dodatnaStampa.trim() : "",
          dimenzija:        Number(dimenzija),
          lokacija_klisea:  stampa && odabraniKliseRed ? odabraniKliseRed.lokacija : null,
          barkod_proizvoda: barkod.trim(),
          napomena:         napomena.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        openModal("error", data.message || "Greška pri snimanju narudžbe");
      } else {
        openModal("success", "Narudžba uspješno snimljena!");
        ucitajNarudzbe();
        setOdabrani(null);
        resetForma();
      }
    } catch {
      openModal("error", "Greška pri povezivanju sa serverom");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 space-y-2 h-full">
      <div className="flex gap-3 items-start justify-center h-full">
        {/* ─── LIJEVO — tabela proizvoda (širina po sadržaju) ─── */}
        <div className="w-max min-w-[300px] max-w-[34%] flex-shrink-0 max-h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100"
            style={{ background: "#f4f1f9" }}
          >
            <ShoppingCart size={14} style={{ color: PRIMARY }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: PRIMARY }}
            >
              Proizvodi — papirne kese
            </span>
            {!loadingProizvodi && (
              <span className="ml-auto text-xs text-gray-400">
                {filtrirani.length} / {proizvodi.length}
              </span>
            )}
            <button
              onClick={ucitajProizvode}
              disabled={loadingProizvodi}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-40"
              title="Osvježi"
            >
              <RefreshCw
                className={`w-3 h-3 ${loadingProizvodi ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Pretraga */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={pretraga}
                onChange={(e) => setPretraga(e.target.value)}
                placeholder="Pretraga po šifri, nazivu..."
                className={`${inputClass} pl-8`}
                {...focusProps}
              />
            </div>
          </div>

          {loadingProizvodi && (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2 size={18} className="animate-spin" style={{ color: PRIMARY }} />
              <span className="text-sm text-gray-400">Učitavanje...</span>
            </div>
          )}

          {!loadingProizvodi && loadError && (
            <div className="flex items-center gap-2 text-red-600 text-xs px-4 py-4">
              <AlertCircle className="w-4 h-4" /> {loadError}
            </div>
          )}

          {!loadingProizvodi && !loadError && filtrirani.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">
              {proizvodi.length === 0 ? "Nema proizvoda." : "Nema rezultata pretrage."}
            </p>
          )}

          {!loadingProizvodi && filtrirani.length > 0 && (
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full table-auto text-sm border-collapse">
                <thead className="sticky top-0">
                  <tr
                    className="text-xs font-semibold text-white uppercase tracking-wider"
                    style={{ background: PRIMARY }}
                  >
                    {KOLONE_TABELE.map((k) => (
                      <th key={k.key} className="px-3 py-2.5 text-left">
                        {k.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrirani.map((p, idx) => {
                    const sifra = vrijednost(p, POLJE.sifra) || String(idx);
                    const isSelected =
                      odabrani !== null && vrijednost(odabrani, POLJE.sifra) === sifra;
                    const isHovered = hoveredSifra === sifra;
                    const bg = isSelected
                      ? SEL_BG
                      : isHovered
                        ? "#f0fdf4"
                        : idx % 2 === 1
                          ? "rgba(237, 233, 254, 0.3)"
                          : "white";

                    return (
                      <tr
                        key={sifra}
                        onClick={() => handleSelect(p)}
                        onMouseEnter={() => setHoveredSifra(sifra)}
                        onMouseLeave={() => setHoveredSifra(null)}
                        style={{
                          backgroundColor: bg,
                          border: isSelected
                            ? `2px solid ${SEL_BORDER}`
                            : undefined,
                          borderBottom: isSelected ? undefined : "1px solid #f3f4f6",
                          cursor: "pointer",
                        }}
                      >
                        {KOLONE_TABELE.map((k) => (
                          <td key={k.key} className="px-3 py-2 whitespace-nowrap">
                            {k.mono ? (
                              <span
                                className="font-mono text-xs font-semibold"
                                style={{ color: PRIMARY }}
                              >
                                {vrijednost(p, k.key)}
                              </span>
                            ) : (
                              <span className="text-gray-800">{vrijednost(p, k.key)}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── SREDINA — forma narudžbe ─── */}
        <div className="w-[440px] flex-shrink-0 max-h-full overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100"
            style={{ background: "#f4f1f9" }}
          >
            <Send size={14} style={{ color: SECONDARY }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: SECONDARY }}
            >
              Nova narudžba
            </span>
          </div>

          {!odabrani && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                style={{ background: `${SECONDARY}20` }}
              >
                <MousePointerClick size={18} style={{ color: SECONDARY }} />
              </div>
              <p className="text-sm font-semibold text-gray-500">Odaberite proizvod</p>
              <p className="text-xs text-gray-400">
                Kliknite na red u tabeli da biste unijeli narudžbu.
              </p>
            </div>
          )}

          {odabrani && (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Info kartica */}
              <div
                className="rounded-xl px-3 py-2.5 border"
                style={{ background: SEL_BG, borderColor: SEL_BORDER }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold" style={{ color: SEL_BORDER }}>
                    {vrijednost(odabrani, POLJE.sifra)}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {vrijednost(odabrani, POLJE.naziv)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                  <span>JM: <b>{vrijednost(odabrani, POLJE.jm) || "—"}</b></span>
                </div>
              </div>

              <div>
                <Label>Br. narudžbe klijenta</Label>
                <input
                  type="text"
                  value={brNarudzbeKlijenta}
                  onChange={(e) => setBrNarudzbeKlijenta(e.target.value)}
                  placeholder="npr. PO-2026-0154"
                  maxLength={254}
                  className={inputClass}
                  {...focusProps}
                />
              </div>

              <div>
                <Label>Količina *</Label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={kolicina}
                    onChange={(e) => setKolicina(e.target.value.replace(/\D/g, ""))}
                    placeholder="npr. 10000"
                    className={`${inputClass} pr-14`}
                    autoFocus
                    {...focusProps}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                    {vrijednost(odabrani, POLJE.jm)}
                  </span>
                </div>
              </div>

              <div>
                <Label>Dodijeljena mašini *</Label>
                <select
                  value={masina}
                  onChange={(e) => setMasina(e.target.value)}
                  className={`${inputClass} bg-white`}
                  onFocus={(e) => (e.target.style.borderColor = SECONDARY)}
                  onBlur={(e) => (e.target.style.borderColor = "rgb(229 231 235)")}
                >
                  <option value="">— izaberi mašinu —</option>
                  {masine.map((m) => (
                    <option key={m.sifra_masine} value={m.sifra_masine}>
                      {m.naziv_masine}
                    </option>
                  ))}
                </select>
                {masineError && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                    <AlertCircle className="w-3 h-3" /> {masineError}
                  </p>
                )}
              </div>

              {/* Štampa */}
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stampa}
                  onChange={(e) => setStampa(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: SECONDARY }}
                />
                Sa štampom
              </label>

              <div>
                <Label>Vrsta štampe</Label>
                <input
                  type="text"
                  value={vrstaStampe}
                  onChange={(e) => setVrstaStampe(e.target.value)}
                  placeholder="npr. 2 boje"
                  disabled={!stampa}
                  className={inputClass}
                  {...focusProps}
                />
              </div>

              <div>
                <Label>Kliše — lokacija</Label>
                <select
                  value={odabraniKlise}
                  onChange={(e) => setOdabraniKlise(e.target.value)}
                  disabled={!stampa}
                  className={`${inputClass} bg-white`}
                  onFocus={(e) => (e.target.style.borderColor = SECONDARY)}
                  onBlur={(e) => (e.target.style.borderColor = "rgb(229 231 235)")}
                >
                  <option value="">— bez klišea —</option>
                  {kliseZaProizvod.length > 0 && (
                    <optgroup label="Za ovaj proizvod">
                      {kliseZaProizvod.map((k) => (
                        <option key={k.sifra} value={k.sifra}>
                          {k.naziv_stampe} — lok. {k.lokacija}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={kliseZaProizvod.length > 0 ? "Ostali klišei" : "Svi klišei"}>
                    {kliseOstali.map((k) => (
                      <option key={k.sifra} value={k.sifra}>
                        {k.naziv_stampe} — lok. {k.lokacija}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {kliseError && (
                  <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                    <AlertCircle className="w-3 h-3" /> {kliseError}
                  </p>
                )}
              </div>

              <div>
                <Label>Dodatna štampa — PDF dizajna</Label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={dodatnaStampa}
                    onChange={(e) => setDodatnaStampa(e.target.value)}
                    placeholder={MAPA_DIZAJNA + "..."}
                    disabled={!stampa}
                    title={dodatnaStampa}
                    className={`${inputClass} font-mono text-xs`}
                    {...focusProps}
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={!stampa}
                    className="flex-shrink-0 flex items-center gap-1 px-3 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40"
                    style={{ background: SECONDARY }}
                    title="Izaberi PDF dizajna"
                  >
                    <Paperclip size={14} />
                    PDF
                  </button>
                  {/* Skriveni izbor fajla — čita se samo naziv, fajl se ne uploaduje */}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handlePdfIzbor}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Fajl se ne šalje — upisuje se samo putanja. Ako je PDF u podmapi, ispravi putanju ručno.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  {/* Predloženo iz naziva proizvoda — operater može promijeniti */}
                  <Label>Dimenzija *</Label>
                  <input
                    type="number"
                    value={dimenzija}
                    onChange={(e) => setDimenzija(e.target.value)}
                    placeholder="npr. 10"
                    className={inputClass}
                    {...focusProps}
                  />
                  {odabrani && dimenzijaIzNaziva(vrijednost(odabrani, POLJE.naziv)) &&
                    dimenzija !== dimenzijaIzNaziva(vrijednost(odabrani, POLJE.naziv)) && (
                    <button
                      type="button"
                      onClick={() => setDimenzija(dimenzijaIzNaziva(vrijednost(odabrani, POLJE.naziv)))}
                      className="text-[11px] mt-1 underline"
                      style={{ color: SECONDARY }}
                    >
                      Vrati prijedlog: {dimenzijaIzNaziva(vrijednost(odabrani, POLJE.naziv))}
                    </button>
                  )}
                </div>
                <div>
                  <Label>Barkod</Label>
                  <input
                    type="text"
                    value={barkod}
                    onChange={(e) => setBarkod(e.target.value)}
                    placeholder="3871234567890"
                    maxLength={50}
                    className={inputClass}
                    {...focusProps}
                  />
                </div>
              </div>

              <div>
                <Label>Napomena</Label>
                <textarea
                  value={napomena}
                  onChange={(e) => setNapomena(e.target.value)}
                  placeholder="Napomena..."
                  maxLength={254}
                  rows={2}
                  className={`${inputClass} resize-none`}
                  {...focusProps}
                />
              </div>

              {!formaOk && (
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  Nedostaje: {nedostaje.join(", ")}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formaOk}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: SECONDARY }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? "Snimanje..." : "Snimi narudžbu"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ─── DESNO — narudžbe u proizvodnji (narudzba_zavrsena = 1) ─── */}
        <div className="w-[340px] flex-shrink-0 max-h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100"
            style={{ background: "#f4f1f9" }}
          >
            <Factory size={14} style={{ color: PRIMARY }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: PRIMARY }}
            >
              U proizvodnji
            </span>
            {!loadingNarudzbe && (
              <span className="ml-auto text-xs text-gray-400">{uProizvodnji.length}</span>
            )}
            <button
              onClick={ucitajNarudzbe}
              disabled={loadingNarudzbe}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-40"
              title="Osvježi"
            >
              <RefreshCw className={`w-3 h-3 ${loadingNarudzbe ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingNarudzbe && (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2 size={18} className="animate-spin" style={{ color: PRIMARY }} />
              <span className="text-sm text-gray-400">Učitavanje...</span>
            </div>
          )}

          {!loadingNarudzbe && narudzbeError && (
            <div className="flex items-center gap-2 text-red-600 text-xs px-4 py-4">
              <AlertCircle className="w-4 h-4" /> {narudzbeError}
            </div>
          )}

          {!loadingNarudzbe && !narudzbeError && nemaStatusa && (
            <div className="flex items-start gap-2 text-amber-600 text-xs px-4 pt-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Procedura ne vraća kolonu {KOLONA_STATUSA} — dodati je u SELECT.
            </div>
          )}

          {!loadingNarudzbe && !narudzbeError && uProizvodnji.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">
              Nema narudžbi u proizvodnji.
            </p>
          )}

          {!loadingNarudzbe && uProizvodnji.length > 0 && (
            <div className="overflow-y-auto flex-1 min-h-0 p-2 space-y-2">
              {uProizvodnji.map((n, idx) => {
                const naziv = polje(n, NARUDZBA_POLJA.naziv);
                const kol = Number(polje(n, NARUDZBA_POLJA.kolicina)) || 0;
                const urad = Number(polje(n, NARUDZBA_POLJA.uradjeno)) || 0;
                const jm = polje(n, NARUDZBA_POLJA.jm);
                const masinaN = polje(n, NARUDZBA_POLJA.masina);
                const klijent = polje(n, NARUDZBA_POLJA.klijent);
                const datum = polje(n, NARUDZBA_POLJA.datum);
                const dim = polje(n, NARUDZBA_POLJA.dimenzija);
                const nap = polje(n, NARUDZBA_POLJA.napomena);
                const procenat = kol > 0 ? Math.min(100, Math.round((urad / kol) * 100)) : 0;

                return (
                  <div
                    key={polje(n, NARUDZBA_POLJA.id) || idx}
                    className="rounded-xl border border-gray-100 px-3 py-2 text-xs"
                    style={{ background: idx % 2 ? "rgba(237, 233, 254, 0.3)" : "white" }}
                  >
                        <div className="flex items-start gap-2">
                          <span className="font-semibold text-gray-800 text-sm leading-tight flex-1">
                            {naziv}
                          </span>
                          {datum && (
                            <span className="text-gray-400 whitespace-nowrap">{formatDatum(datum)}</span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-500 mt-1">
                          {masinaN && <span>Mašina: <b className="text-gray-700">{masinaN}</b></span>}
                          {dim && <span>Dim: <b className="text-gray-700">{dim}</b></span>}
                          {klijent && klijent !== "-" && <span>Klijent: <b className="text-gray-700">{klijent}</b></span>}
                        </div>

                        {kol > 0 && (
                          <div className="mt-1.5">
                            <div className="flex justify-between text-gray-500 mb-0.5">
                              <span>
                                {urad.toLocaleString("sr-Latn-BA")} / {kol.toLocaleString("sr-Latn-BA")} {jm}
                              </span>
                              <span className="font-semibold" style={{ color: SECONDARY }}>{procenat}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${procenat}%`, background: SECONDARY }}
                              />
                            </div>
                          </div>
                        )}

                        {nap && nap !== "-" && (
                          <div className="italic text-gray-400 mt-1">{nap}</div>
                        )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL — POTVRDA PRIJE SNIMANJA ─── */}
      {potvrdaOpen && odabrani && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setPotvrdaOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-2 px-5 py-3 border-b border-gray-100"
              style={{ background: "#f4f1f9" }}
            >
              <ShoppingCart size={16} style={{ color: PRIMARY }} />
              <span className="text-sm font-bold" style={{ color: PRIMARY }}>
                Potvrda narudžbe
              </span>
            </div>

            <div className="px-5 py-4">
              <div className="mb-3">
                <div className="font-mono text-xs font-bold" style={{ color: SEL_BORDER }}>
                  {vrijednost(odabrani, POLJE.sifra)}
                </div>
                <div className="text-base font-semibold text-gray-800">
                  {vrijednost(odabrani, POLJE.naziv)}
                </div>
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                {[
                  ["Količina", `${Number(kolicina).toLocaleString("sr-Latn-BA")} ${vrijednost(odabrani, POLJE.jm)}`],
                  ["Mašina", nazivMasine],
                  ["Dimenzija", dimenzija],
                  ["Br. narudžbe klijenta", brNarudzbeKlijenta.trim()],
                  ["Štampa", stampa ? "DA" : "NE"],
                  ...(stampa
                    ? [
                        ["Vrsta štampe", vrstaStampe.trim()],
                        ["Kliše", odabraniKliseRed ? `${odabraniKliseRed.naziv_stampe} — lok. ${odabraniKliseRed.lokacija}` : ""],
                        ["PDF dizajna", dodatnaStampa.trim()],
                      ]
                    : []),
                  ["Barkod", barkod.trim()],
                  ["Napomena", napomena.trim()],
                ].map(([label, val]) => (
                  <div key={label} className="contents">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-0.5 whitespace-nowrap">
                      {label}
                    </dt>
                    <dd className="text-gray-800 font-medium break-all">
                      {val || <span className="text-gray-300">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setPotvrdaOpen(false)}
                className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Nazad
              </button>
              <button
                type="button"
                onClick={posaljiNarudzbu}
                autoFocus
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: SECONDARY }}
              >
                <CheckCircle size={14} />
                Potvrdi i snimi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ─── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={modalStatus !== "loading" ? handleCloseModal : undefined}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {modalStatus !== "loading" && (
              <div className="h-1 w-full bg-gray-100">
                <div
                  className="h-1 transition-all"
                  style={{
                    width: `${modalProgress}%`,
                    transitionDuration: "3s",
                    transitionTimingFunction: "linear",
                    background: modalStatus === "success" ? SECONDARY : "#ef4444",
                  }}
                />
              </div>
            )}

            <div className="px-8 py-8 flex flex-col items-center gap-4 text-center">
              {modalStatus === "loading" && (
                <>
                  <Loader2 size={44} className="animate-spin" style={{ color: PRIMARY }} />
                  <p className="text-sm font-semibold text-gray-600">Snimanje narudžbe...</p>
                </>
              )}
              {modalStatus === "success" && (
                <>
                  <CheckCircle size={44} style={{ color: SECONDARY }} />
                  <p className="text-sm font-semibold text-gray-800">{modalMessage}</p>
                  <p className="text-xs text-gray-400">Prozor se automatski zatvara...</p>
                </>
              )}
              {modalStatus === "error" && (
                <>
                  <XCircle size={44} className="text-red-500" />
                  <p className="text-sm font-semibold text-gray-800">{modalMessage}</p>
                  <p className="text-xs text-gray-400">Prozor se automatski zatvara...</p>
                </>
              )}
            </div>

            {modalStatus !== "loading" && (
              <div className="px-6 pb-5">
                <button
                  onClick={handleCloseModal}
                  className="w-full py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Zatvori
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
