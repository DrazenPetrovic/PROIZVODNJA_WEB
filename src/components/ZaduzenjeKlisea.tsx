import { useState, useEffect, useRef } from "react";
import { theme } from "../theme";
import {
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Layers,
  MousePointerClick,
  Loader2,
} from "lucide-react";

const PRIMARY = theme.primary;
const SECONDARY = theme.secondary;
const SEL_BG = "#dcfce7";
const SEL_BORDER = "#16a34a";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3004";

interface Klisea {
  sifra: number;
  naziv_klisea: string;
  lokacija_partnera: string;
  dimenzija_za_stampu: string;
  povrsina_klisea: string;
  cijena_klisea: string;
  datum_narcucivanja: string;
  napomena: string;
}

type ModalStatus = "loading" | "success" | "error";

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none transition-all text-gray-800 placeholder:text-gray-300";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
    {children}
  </label>
);

const NUM_COLS = 7;

export default function ZaduzenjeKlisea() {
  const [klisea, setKlisea] = useState<Klisea[]>([]);
  const [loadingKlisea, setLoadingKlisea] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [odabrani, setOdabrani] = useState<Klisea | null>(null);
  const [hoveredSifra, setHoveredSifra] = useState<number | null>(null);

  const [napomena, setNapomena] = useState("");
  const [dimenzije, setDimenzije] = useState("");
  const [ladica, setLadica] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStatus>("loading");
  const [modalMessage, setModalMessage] = useState("");
  const [modalProgress, setModalProgress] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ucitajKlisea = async () => {
    setLoadingKlisea(true);
    setLoadError("");
    try {
      const res = await fetch(`${API_URL}/api/klise-zaduzivanje/pregled`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        setLoadError(data.message || "Greška pri učitavanju");
      else setKlisea(data.data);
    } catch {
      setLoadError("Greška pri povezivanju sa serverom");
    } finally {
      setLoadingKlisea(false);
    }
  };

  useEffect(() => {
    ucitajKlisea();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    const ct = closeTimer.current;
    const pt = progressTimer.current;
    return () => {
      if (ct) clearTimeout(ct);
      if (pt) clearTimeout(pt);
    };
  }, []);

  const openModal = (status: ModalStatus, message: string) => {
    setModalStatus(status);
    setModalMessage(message);
    setModalProgress(0);
    setModalOpen(true);

    if (status === "loading") return;

    // Animate progress bar to 100% over 3s
    requestAnimationFrame(() => {
      setModalProgress(100);
    });

    // Auto-close after 3s
    closeTimer.current = setTimeout(() => {
      setModalOpen(false);
    }, 3300);
  };

  const handleCloseModal = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (progressTimer.current) clearTimeout(progressTimer.current);
    setModalOpen(false);
  };

  const handleSelect = (k: Klisea) => {
    setOdabrani(k);
    setDimenzije(k.dimenzija_za_stampu ?? "");
    setNapomena("");
    setLadica("");
  };

  const handleCancel = () => {
    setOdabrani(null);
    setNapomena("");
    setDimenzije("");
    setLadica("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odabrani) return;
    setSubmitting(true);
    openModal("loading", "");

    try {
      const res = await fetch(`${API_URL}/api/klise-zaduzivanje/zaduzivanje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sifraTabele: odabrani.sifra,
          napomenaRadnika: napomena.trim() || "-",
          dimenzije,
          ladica: ladica.trim() ? Number(ladica) : -1,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        openModal("error", data.message || "Greška pri izvršavanju procedure");
      } else {
        openModal("success", "Zaduženje uspješno izvršeno!");
        setOdabrani(null);
        setNapomena("");
        setDimenzije("");
        setLadica("");
        ucitajKlisea();
      }
    } catch {
      openModal("error", "Greška pri povezivanju sa serverom");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 space-y-2">
      <div className="flex gap-3 items-start">
        {/* ─── LIJEVO — tabela klišea ─── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100"
            style={{ background: "#f4f1f9" }}
          >
            <Layers size={14} style={{ color: PRIMARY }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: PRIMARY }}
            >
              Registrovani klišei
            </span>
            {!loadingKlisea && (
              <span className="ml-auto text-xs text-gray-400">
                {klisea.length} zapisa
              </span>
            )}
            <button
              onClick={ucitajKlisea}
              disabled={loadingKlisea}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-40"
              title="Osvježi"
            >
              <RefreshCw
                className={`w-3 h-3 ${loadingKlisea ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {loadingKlisea && (
            <div className="flex items-center justify-center py-10 gap-2">
              <Loader2
                size={18}
                className="animate-spin"
                style={{ color: PRIMARY }}
              />
              <span className="text-sm text-gray-400">Učitavanje...</span>
            </div>
          )}

          {!loadingKlisea && loadError && (
            <div className="flex items-center gap-2 text-red-600 text-xs px-4 py-4">
              <AlertCircle className="w-4 h-4" /> {loadError}
            </div>
          )}

          {!loadingKlisea && !loadError && klisea.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">
              Nema registrovanih klišea.
            </p>
          )}

          {!loadingKlisea && klisea.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr
                    className="text-xs font-semibold text-white uppercase tracking-wider"
                    style={{ background: PRIMARY }}
                  >
                    <th className="px-3 py-2.5 text-left">Šifra</th>
                    <th className="px-3 py-2.5 text-left">Naziv klišea</th>
                    <th className="px-3 py-2.5 text-left">Lokacija</th>
                    <th className="px-2 py-2.5 text-left">Dimenzija</th>
                    <th className="px-2 py-2.5 text-left">Površina</th>
                    <th className="px-2 py-2.5 text-left">Cijena</th>
                    <th className="px-2 py-2.5 text-left" style={{ width: "120px", minWidth: "120px", maxWidth: "120px" }}>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {klisea.map((k, idx) => {
                    const isSelected = odabrani?.sifra === k.sifra;
                    const isHovered = hoveredSifra === k.sifra;
                    const isEven = idx % 2 === 1;

                    const bg = isSelected
                      ? SEL_BG
                      : isHovered
                        ? "#f0fdf4"
                        : isEven
                          ? "rgba(237, 233, 254, 0.3)"
                          : "white";

                    const topBorder = isSelected
                      ? `2px solid ${SEL_BORDER}`
                      : "1px solid #f3f4f6";

                    return (
                      <>
                        {/* ── Red 1 — glavni podaci ── */}
                        <tr
                          key={`${k.sifra}-main`}
                          onClick={() => handleSelect(k)}
                          onMouseEnter={() => setHoveredSifra(k.sifra)}
                          onMouseLeave={() => setHoveredSifra(null)}
                          style={{
                            backgroundColor: bg,
                            borderTop: topBorder,
                            borderBottom: 0,
                            cursor: "pointer",
                          }}
                        >
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs font-semibold" style={{ color: PRIMARY }}>
                              {k.sifra}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">
                            {k.naziv_klisea}
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {k.lokacija_partnera}
                          </td>
                          <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                            {k.dimenzija_za_stampu}
                          </td>
                          <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                            {k.povrsina_klisea}
                          </td>
                          <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                            {k.cijena_klisea}
                          </td>
                          <td className="px-2 py-2 text-gray-600 whitespace-nowrap" style={{ width: "120px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {k.datum_narcucivanja}
                          </td>
                        </tr>

                        {/* ── Red 2 — napomena ── */}
                        <tr
                          key={`${k.sifra}-nap`}
                          onClick={() => handleSelect(k)}
                          onMouseEnter={() => setHoveredSifra(k.sifra)}
                          onMouseLeave={() => setHoveredSifra(null)}
                          style={{
                            backgroundColor: bg,
                            borderBottom: isSelected
                              ? `2px solid ${SEL_BORDER}`
                              : "1px solid #f3f4f6",
                            cursor: "pointer",
                          }}
                        >
                          <td
                            colSpan={NUM_COLS}
                            className="px-3 pb-1.5 text-xs text-gray-400 italic"
                            style={{ paddingTop: 0 }}
                          >
                            {k.napomena && k.napomena !== "-" ? (
                              k.napomena
                            ) : (
                              <span className="opacity-40">—</span>
                            )}
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── DESNO — forma za zaduživanje ─── */}
        <div className="w-[440px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100"
            style={{ background: "#f4f1f9" }}
          >
            <Send size={14} style={{ color: SECONDARY }} />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: SECONDARY }}
            >
              Zaduživanje
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
              <p className="text-sm font-semibold text-gray-500">
                Odaberite klišea
              </p>
              <p className="text-xs text-gray-400">
                Kliknite na red u tabeli da biste pokrenuli zaduživanje.
              </p>
            </div>
          )}

          {odabrani && (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Info kartica */}
              <div
                className="rounded-xl px-3 py-2.5 space-y-1 border"
                style={{ background: SEL_BG, borderColor: SEL_BORDER }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: SEL_BORDER }}
                  >
                    {odabrani.sifra}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {odabrani.naziv_klisea}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div>{odabrani.lokacija_partnera}</div>
                  <div className="flex flex-wrap gap-2">
                    <span>{odabrani.dimenzija_za_stampu}</span>
                    <span>{odabrani.povrsina_klisea}</span>
                    <span>{odabrani.cijena_klisea}</span>
                    <span>{odabrani.datum_narcucivanja}</span>
                  </div>
                  {odabrani.napomena && odabrani.napomena !== "-" && (
                    <div className="italic text-gray-400">
                      {odabrani.napomena}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Dimenzije klišea</Label>
                <input
                  type="text"
                  value={dimenzije}
                  onChange={(e) => setDimenzije(e.target.value)}
                  placeholder="npr. 200x300"
                  className={inputClass}
                  onFocus={(e) => (e.target.style.borderColor = SECONDARY)}
                  onBlur={(e) => (e.target.style.borderColor = "rgb(229 231 235)")}
                />
              </div>

              <div>
                <Label>Ladica</Label>
                <input
                  type="number"
                  value={ladica}
                  onChange={(e) => setLadica(e.target.value)}
                  placeholder="0"
                  className={inputClass}
                  onFocus={(e) => (e.target.style.borderColor = SECONDARY)}
                  onBlur={(e) => (e.target.style.borderColor = "rgb(229 231 235)")}
                />
              </div>

              <div>
                <Label>Napomena</Label>
                <input
                  type="text"
                  value={napomena}
                  onChange={(e) => setNapomena(e.target.value)}
                  placeholder="Napomena radnika..."
                  maxLength={254}
                  className={inputClass}
                  onFocus={(e) => (e.target.style.borderColor = SECONDARY)}
                  onBlur={(e) => (e.target.style.borderColor = "rgb(229 231 235)")}
                />
              </div>

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
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background: SECONDARY }}
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {submitting ? "Izvršavanje..." : "Zaduži"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

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
            {/* Progress bar (visible only on success/error) */}
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
                  <Loader2
                    size={44}
                    className="animate-spin"
                    style={{ color: PRIMARY }}
                  />
                  <p className="text-sm font-semibold text-gray-600">
                    Izvršavanje zaduženja...
                  </p>
                </>
              )}

              {modalStatus === "success" && (
                <>
                  <CheckCircle size={44} style={{ color: SECONDARY }} />
                  <p className="text-sm font-semibold text-gray-800">
                    {modalMessage}
                  </p>
                  <p className="text-xs text-gray-400">
                    Prozor se automatski zatvara...
                  </p>
                </>
              )}

              {modalStatus === "error" && (
                <>
                  <XCircle size={44} className="text-red-500" />
                  <p className="text-sm font-semibold text-gray-800">
                    {modalMessage}
                  </p>
                  <p className="text-xs text-gray-400">
                    Prozor se automatski zatvara...
                  </p>
                </>
              )}
            </div>

            {/* Close button (success/error only) */}
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
