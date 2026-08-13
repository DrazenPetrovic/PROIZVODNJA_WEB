import { useState, useEffect, useCallback, useRef } from "react";
import { theme } from "../theme";
import { getCurrentUser } from "../utils/auth";
import { Package, RefreshCw, BellRing, AlertTriangle } from "lucide-react";

const PRIMARY   = theme.primary;
const SECONDARY = theme.secondary;
const API_URL   = import.meta.env.VITE_API_URL || "http://localhost:3004";

interface NarucenaKutija {
  sifra_tabele:         number;
  sifra_terena_dostava: number;
  sifra_partnera:       number;
  naziv_partnera:       string;
  sifra_proizvoda:      number;
  naziv_proizvoda:      string;
  napomena:             string;
  stampano:             number;
  kolicina_proizvoda:   number;
  datum_dostave:        string;
  datum_narudzbe:       string;
}

interface IzmjenaProizvoda {
  sifra_tabele:          number;
  naziv_partnera:        string;
  stara_sifra_proizvoda: number;
  stari_naziv_proizvoda: string;
  nova_sifra_proizvoda:  number;
  novi_naziv_proizvoda:  string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()} ${hh}:${min}`;
}

function getDateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

function formatKolicina(k: number): string {
  const n = Number(k);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function playNotifikacija(ref: React.MutableRefObject<HTMLAudioElement | null>) {
  try {
    const audio = new Audio(`${import.meta.env.BASE_URL}zvuk/notifikacija_proizvodnja_30s.wav`);
    ref.current = audio;
    audio.play();
  } catch {
    // browser može blokirati autoplay
  }
}

function stopNotifikacija(ref: React.MutableRefObject<HTMLAudioElement | null>) {
  if (ref.current) {
    ref.current.pause();
    ref.current.currentTime = 0;
    ref.current = null;
  }
}

export function RadOperaterKutije() {
  const [data,         setData]         = useState<NarucenaKutija[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);
  const [noviUnosi,    setNoviUnosi]    = useState<NarucenaKutija[]>([]);
  const [izmjeneProizvoda, setIzmjeneProizvoda] = useState<IzmjenaProizvoda[]>([]);
  const [pendingData,      setPendingData]      = useState<NarucenaKutija[] | null>(null);
  const [potvrda,           setPotvrda]           = useState<NarucenaKutija | null>(null);
  const [potvrdaLoading,    setPotvrdaLoading]    = useState(false);
  const [potvrdaError,      setPotvrdaError]      = useState("");
  const [napomenaOperatera, setNapomenaOperatera] = useState("");
  const [zavrseneSifre,     setZavrseneSifre]     = useState<Set<number>>(new Set());

  // Set poznatih sifra_tabele — inicijaliziramo pri prvom fetchu, ne okidamo modal
  const poznateSifre = useRef<Set<number>>(new Set());
  const prviLoad     = useRef(true);
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  // Snimak posljednjih primijenjenih podataka — koristi se za poređenje sa svježe dohvaćenim
  const dataRef       = useRef<NarucenaKutija[]>([]);

  const fetchZavrseno = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/kutije/zavrseno`, { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setZavrseneSifre(new Set(json.data.map((r: { sifra_tabele: number }) => r.sifra_tabele)));
      }
    } catch { /* tihi fail */ }
  }, []);

  const handlePotvrda = async () => {
    if (!potvrda) return;
    setPotvrdaLoading(true);
    setPotvrdaError("");
    const user = getCurrentUser();
    try {
      const res = await fetch(`${API_URL}/api/kutije/potvrda`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sifra_tabele:         potvrda.sifra_tabele,
          sifra_terena_dostava: potvrda.sifra_terena_dostava,
          sifra_partnera:       potvrda.sifra_partnera,
          naziv_partnera:       potvrda.naziv_partnera,
          sifra_proizvoda:      potvrda.sifra_proizvoda,
          naziv_proizvoda:      potvrda.naziv_proizvoda,
          napomena:             potvrda.napomena,
          kolicina_proizvoda:   potvrda.kolicina_proizvoda,
          id_operatera:         user?.sifraRadnika,
          naziv_operatera:      user?.username,
          napomena_operatera:   napomenaOperatera,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPotvrda(null);
        setNapomenaOperatera("");
        fetchData();
        fetchZavrseno();
      } else {
        setPotvrdaError(json.message || "Greška pri upisu.");
      }
    } catch {
      setPotvrdaError("Greška pri povezivanju sa serverom.");
    } finally {
      setPotvrdaLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/kutije/pregled`, { credentials: "include" });
      const json = await res.json();
      if (!json.success) return;

      const sorted: NarucenaKutija[] = [...json.data].sort(
        (a, b) => new Date(a.datum_dostave).getTime() - new Date(b.datum_dostave).getTime()
      );

      if (prviLoad.current) {
        // Inicijalni load — samo zapamtimo sifre, bez modala
        sorted.forEach((item) => poznateSifre.current.add(item.sifra_tabele));
        prviLoad.current = false;
        setData(sorted);
        dataRef.current = sorted;
      } else {
        // Pronađi nove unose
        const novi = sorted.filter((item) => !poznateSifre.current.has(item.sifra_tabele));
        if (novi.length > 0) {
          novi.forEach((item) => poznateSifre.current.add(item.sifra_tabele));
          setNoviUnosi(novi);
          playNotifikacija(audioRef);
        }

        // Provjeri da li je magacioner u međuvremenu promijenio proizvod
        // na nekoj već poznatoj narudžbi (sifra_proizvoda se razlikuje)
        const izmjene: IzmjenaProizvoda[] = [];
        sorted.forEach((item) => {
          const staro = dataRef.current.find((d) => d.sifra_tabele === item.sifra_tabele);
          if (staro && staro.sifra_proizvoda !== item.sifra_proizvoda) {
            izmjene.push({
              sifra_tabele:          item.sifra_tabele,
              naziv_partnera:        item.naziv_partnera,
              stara_sifra_proizvoda: staro.sifra_proizvoda,
              stari_naziv_proizvoda: staro.naziv_proizvoda,
              nova_sifra_proizvoda:  item.sifra_proizvoda,
              novi_naziv_proizvoda:  item.naziv_proizvoda,
            });
          }
        });

        if (izmjene.length > 0) {
          // Ne prepisuj odmah prikaz — sačekaj da operater potvrdi izmjenu
          setIzmjeneProizvoda(izmjene);
          setPendingData(sorted);
          playNotifikacija(audioRef);
        } else {
          setData(sorted);
          dataRef.current = sorted;
        }
      }

      setLastUpdate(new Date());
    } catch {
      // tihi fail — pokušava ponovo za 60s
    } finally {
      setLoading(false);
    }
  }, []);

  const primijeniIzmjene = () => {
    if (pendingData) {
      setData(pendingData);
      dataRef.current = pendingData;
      setPendingData(null);
    }
    setIzmjeneProizvoda([]);
    stopNotifikacija(audioRef);
  };

  useEffect(() => {
    fetchData();
    fetchZavrseno();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData, fetchZavrseno]);

  // Grupišemo po datumu dostave
  const grouped: { dateKey: string; label: string; items: NarucenaKutija[] }[] = [];
  for (const item of data) {
    const dateKey  = getDateKey(item.datum_dostave);
    const existing = grouped.find((g) => g.dateKey === dateKey);
    if (existing) {
      existing.items.push(item);
    } else {
      grouped.push({ dateKey, label: formatDate(item.datum_dostave), items: [item] });
    }
  }

  return (
    <>
      {/* ─── MODAL POTVRDA ZAVRŠETKA ─── */}
      {potvrda && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

            <div className="px-6 py-4" style={{ backgroundColor: PRIMARY }}>
              <p className="text-white font-bold text-base">Potvrda završetka</p>
              <p className="text-white opacity-70 text-xs mt-0.5">Da li ste završili rad na ovom proizvodu?</p>
            </div>

            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500">Proizvod</span>
                <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%]">{potvrda.naziv_proizvoda}</span>
              </div>
              {potvrda.naziv_partnera && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-500">Partner</span>
                  <span className="text-sm text-gray-700 text-right max-w-[60%]">{potvrda.naziv_partnera}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Količina</span>
                <span className="text-sm font-bold" style={{ color: PRIMARY }}>{formatKolicina(potvrda.kolicina_proizvoda)} kom</span>
              </div>
              {potvrda.napomena && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-500">Napomena</span>
                  <span className="text-sm text-gray-500 italic text-right max-w-[60%]">{potvrda.napomena}</span>
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Napomena operatera</label>
                <textarea
                  rows={2}
                  value={napomenaOperatera}
                  onChange={(e) => setNapomenaOperatera(e.target.value)}
                  placeholder="Opcionalna napomena..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none"
                  onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                  onBlur={(e) => (e.target.style.borderColor = "rgb(209 213 219)")}
                />
              </div>

              {potvrdaError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {potvrdaError}
                </div>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button
                onClick={() => { setPotvrda(null); setPotvrdaError(""); }}
                disabled={potvrdaLoading}
                className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
              >
                Odustani
              </button>
              <button
                onClick={handlePotvrda}
                disabled={potvrdaLoading}
                className="px-6 py-2 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50"
                style={{ backgroundColor: SECONDARY }}
                onMouseEnter={(e) => !potvrdaLoading && (e.currentTarget.style.backgroundColor = "#7aad3a")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = SECONDARY)}
              >
                {potvrdaLoading ? "Upisujem..." : "Da, završeno"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL NOVI UNOSI ─── */}
      {noviUnosi.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ backgroundColor: PRIMARY }}>
              <BellRing className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white font-bold text-base">
                {noviUnosi.length === 1 ? "Novi nalog za kutije" : `${noviUnosi.length} nova naloga za kutije`}
              </span>
            </div>

            {/* Lista novih unosa */}
            <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
              {noviUnosi.map((item) => (
                <div
                  key={item.sifra_tabele}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  style={{ borderColor: `${PRIMARY}33` }}
                >
                  <span className="text-sm font-semibold text-gray-800">{item.naziv_proizvoda}</span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: PRIMARY }}>
                    {formatKolicina(item.kolicina_proizvoda)} kom
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-1 flex justify-end">
              <button
                onClick={() => { stopNotifikacija(audioRef); setNoviUnosi([]); }}
                className="px-8 py-2 rounded-xl text-white font-semibold text-sm transition-all"
                style={{ backgroundColor: SECONDARY }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7aad3a")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = SECONDARY)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL IZMJENA PROIZVODA (magacioner ispravio šifru) ─── */}
      {izmjeneProizvoda.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ width: "66vw", height: "66vh" }}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0" style={{ backgroundColor: "#dc2626" }}>
              <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
              <span className="text-white font-bold text-base">
                {izmjeneProizvoda.length === 1
                  ? "Magacioner je izmijenio proizvod na narudžbi"
                  : `Magacioner je izmijenio proizvod na ${izmjeneProizvoda.length} narudžbe`}
              </span>
            </div>

            {/* Tabela izmjena */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-3">Partner</th>
                    <th className="py-2 pr-3">Stari proizvod</th>
                    <th className="py-2 pr-3">Novi proizvod</th>
                  </tr>
                </thead>
                <tbody>
                  {izmjeneProizvoda.map((iz) => (
                    <tr key={iz.sifra_tabele} className="border-b border-gray-100">
                      <td className="py-2 pr-3 text-gray-700">{iz.naziv_partnera || "-"}</td>
                      <td className="py-2 pr-3 text-red-600 font-medium">{iz.stari_naziv_proizvoda}</td>
                      <td className="py-2 pr-3 text-green-700 font-semibold">{iz.novi_naziv_proizvoda}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-1 flex justify-end flex-shrink-0">
              <button
                onClick={primijeniIzmjene}
                className="px-8 py-2 rounded-xl text-white font-semibold text-sm transition-all"
                style={{ backgroundColor: SECONDARY }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7aad3a")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = SECONDARY)}
              >
                Razumijem, primijeni izmjene
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-full flex overflow-hidden">

        {/* ─── LIJEVI PANEL 25% ─── */}
        <div
          className="flex flex-col overflow-hidden border-r"
          style={{ width: "40%", borderColor: `${PRIMARY}33` }}
        >
          {/* Zaglavlje */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: `${PRIMARY}33`, backgroundColor: `${PRIMARY}08` }}
          >
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
              <span className="text-xs font-semibold" style={{ color: PRIMARY }}>
                Naručene kutije
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {lastUpdate && (
                <span className="text-xs text-gray-400">
                  {lastUpdate.toLocaleTimeString("bs-BA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <button
                onClick={fetchData}
                className="p-0.5 rounded hover:bg-gray-200 transition"
                title="Osvježi"
              >
                <RefreshCw className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
            {loading && (
              <div className="text-center text-xs text-gray-400 pt-6">Učitavanje...</div>
            )}
            {!loading && data.length === 0 && (
              <div className="text-center text-xs text-gray-400 pt-6">Nema narudžbi</div>
            )}

            {grouped.map((group) => (
              <div key={group.dateKey}>

                {/* Datum separator */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-px" style={{ backgroundColor: `${PRIMARY}44` }} />
                  <span className="font-bold px-1" style={{ color: PRIMARY, fontSize: "0.9rem" }}>
                    {group.label}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${PRIMARY}44` }} />
                </div>

                {/* Stavke za taj datum */}
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isLogo      = item.naziv_proizvoda.toUpperCase().includes("LOGO");
                    const isZavrseno  = zavrseneSifre.has(item.sifra_tabele);
                    const bgColor     = isZavrseno ? "#9ca3af" : isLogo ? PRIMARY   : SECONDARY;
                    const accentColor = isZavrseno ? "#e5e7eb" : isLogo ? SECONDARY : PRIMARY;
                    return (
                    <div
                      key={item.sifra_tabele}
                      className={`rounded-lg border px-3 py-2.5 flex flex-col gap-1 transition-opacity ${isZavrseno ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:opacity-80"}`}
                      style={{
                        borderColor:     isZavrseno ? "#9ca3af" : item.stampano ? bgColor : `${bgColor}88`,
                        backgroundColor: bgColor,
                      }}
                      onClick={() => { if (!isZavrseno) { setPotvrda(item); setPotvrdaError(""); setNapomenaOperatera(""); } }}
                    >
                      {/* Gornji red: naziv proizvoda + količina */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xl font-bold leading-tight" style={{ color: accentColor }}>
                            {item.naziv_proizvoda}
                            {isZavrseno && <span className="ml-2 text-xs font-normal opacity-80">✓ završeno</span>}
                          </div>
                          {item.naziv_partnera && (
                            <div className="text-base text-white opacity-80 truncate mt-0.5" title={item.naziv_partnera}>
                              {item.naziv_partnera}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right leading-tight">
                          <div className="text-2xl font-bold" style={{ color: accentColor }}>
                            {formatKolicina(item.kolicina_proizvoda)}
                          </div>
                          <div className="text-xs text-white opacity-70">kom</div>
                          {item.datum_narudzbe && (
                            <div className="text-xs text-white opacity-60 mt-0.5">
                              {formatDateTime(item.datum_narudzbe)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Napomena na dnu */}
                      {item.napomena && (
                        <div
                          className="text-xs text-white opacity-60 italic truncate mt-auto pt-1 border-t border-white border-opacity-20"
                          title={item.napomena}
                        >
                          {item.napomena}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── DESNI PANEL 75% ─── */}
        <div className="flex-1 overflow-hidden">
          {/* Ovdje dolaze ostale funkcionalnosti */}
        </div>
      </div>
    </>
  );
}
