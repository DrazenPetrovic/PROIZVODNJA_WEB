import { useState, useEffect, useCallback, useRef } from "react";
import { theme } from "../theme";
import { Package, RefreshCw, CheckCircle, Clock, BellRing } from "lucide-react";

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
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
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

  // Set poznatih sifra_tabele — inicijaliziramo pri prvom fetchu, ne okidamo modal
  const poznateSifre = useRef<Set<number>>(new Set());
  const prviLoad     = useRef(true);
  const audioRef     = useRef<HTMLAudioElement | null>(null);

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
      } else {
        // Pronađi nove unose
        const novi = sorted.filter((item) => !poznateSifre.current.has(item.sifra_tabele));
        if (novi.length > 0) {
          novi.forEach((item) => poznateSifre.current.add(item.sifra_tabele));
          setNoviUnosi(novi);
          playNotifikacija(audioRef);
        }
      }

      setData(sorted);
      setLastUpdate(new Date());
    } catch {
      // tihi fail — pokušava ponovo za 60s
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

      <div className="h-full flex overflow-hidden">

        {/* ─── LIJEVI PANEL 25% ─── */}
        <div
          className="flex flex-col overflow-hidden border-r"
          style={{ width: "25%", borderColor: `${PRIMARY}33` }}
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
                  <span className="text-xs font-bold px-1" style={{ color: PRIMARY }}>
                    {group.label}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: `${PRIMARY}44` }} />
                </div>

                {/* Stavke za taj datum */}
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div
                      key={item.sifra_tabele}
                      className="rounded-lg border px-2.5 py-2"
                      style={{
                        borderColor:     item.stampano ? `${SECONDARY}88` : `${PRIMARY}33`,
                        backgroundColor: item.stampano ? `${SECONDARY}0D` : "white",
                      }}
                    >
                      {/* Glavni red: naziv + količina */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-800 leading-tight flex-1 min-w-0">
                          {item.naziv_proizvoda}
                        </span>
                        <div className="flex-shrink-0 text-right leading-tight">
                          <div className="text-base font-bold" style={{ color: PRIMARY }}>
                            {formatKolicina(item.kolicina_proizvoda)}
                          </div>
                          <div className="text-xs text-gray-400">kom</div>
                        </div>
                      </div>

                      {/* Opciono: partner + stampano */}
                      {item.naziv_partnera && (
                        <div className="flex items-center justify-between mt-1 gap-1">
                          <span className="text-xs text-gray-400 truncate" title={item.naziv_partnera}>
                            {item.naziv_partnera}
                          </span>
                          {item.stampano ? (
                            <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: SECONDARY }} />
                          ) : (
                            <Clock className="w-3 h-3 flex-shrink-0 text-gray-300" />
                          )}
                        </div>
                      )}

                      {/* Opciono: napomena */}
                      {item.napomena && (
                        <div
                          className="text-xs text-gray-400 mt-0.5 italic truncate"
                          title={item.napomena}
                        >
                          {item.napomena}
                        </div>
                      )}
                    </div>
                  ))}
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
