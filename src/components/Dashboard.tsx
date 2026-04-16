import { useState } from 'react';
import ZaduzenjeKlisea from './ZaduzenjeKlisea';
import {
  LogOut,
  ClipboardList,
  Package,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Factory,
} from 'lucide-react';

interface DashboardProps {
  username: string;
  vrstaRadnika: number;
  onLogout: () => void;
}

type MenuSection =
  | 'radni_nalozi'
  | 'materijali'
  | 'rad'
  | 'klisea_zaduzivanje'
  | null;

import { theme } from '../theme';
const PRIMARY   = theme.primary;
const SECONDARY = theme.secondary;

const kliseaSubmenu = [
  { id: 'klisea_zaduzivanje', label: 'Zaduživanje klišea' },
];

export function Dashboard(props: DashboardProps) {
  const { onLogout } = props;
  const [activeSection, setActiveSection] = useState<MenuSection>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [kliseaOpen, setKliseaOpen] = useState(false);
  const simpleMenuItems = [
    { id: 'radni_nalozi', label: 'Radni nalozi', icon: ClipboardList, primary: false },
    { id: 'materijali',   label: 'Materijali',   icon: Package,       primary: false },
    { id: 'rad',          label: 'RAD',          icon: Users,         primary: true  },
  ];

  const isKliseaActive = activeSection?.startsWith('klisea') ?? false;

  const renderContent = () => {
    if (activeSection === 'klisea_zaduzivanje') return <ZaduzenjeKlisea />;

    const labels: Record<Exclude<MenuSection, 'klisea_zaduzivanje' | null>, string> = {
      radni_nalozi: 'Radni nalozi',
      materijali:   'Materijali',
      rad:          'RAD',
    };

    return (
      <div className="p-2">
        <h2 className="text-base font-semibold mb-2" style={{ color: PRIMARY }}>
          {labels[activeSection as Exclude<MenuSection, 'klisea_zaduzivanje' | null>]}
        </h2>
        <div
          className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-gray-400"
          style={{ borderColor: `${PRIMARY}33` }}
        >
          Sadržaj sekcije — u pripremi
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">

      {/* ─── TOP BAR ─── */}
      <div
        className="flex-shrink-0 bg-white flex items-center gap-1 px-2"
        style={{ borderBottom: `2px solid ${PRIMARY}`, height: '36px', minHeight: '36px' }}
      >
        <Factory className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
        <span className="font-bold text-sm whitespace-nowrap" style={{ color: PRIMARY }}>
          Proizvodnja
        </span>

        <span className="text-gray-300 mx-1 text-xs">|</span>

        {!navCollapsed && (
          <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">

            {/* Obični meniji */}
            {simpleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id as MenuSection); setKliseaOpen(false); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    item.primary || isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{ backgroundColor: item.primary ? PRIMARY : isActive ? SECONDARY : undefined }}
                  title={item.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}

            {/* Klišea s podmenijem */}
            <button
              onClick={() => setKliseaOpen(!kliseaOpen)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isKliseaActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={isKliseaActive ? { backgroundColor: SECONDARY } : {}}
              title="Klišea"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Klišea</span>
              <ChevronRight
                className={`w-3 h-3 transition-transform ${kliseaOpen ? 'rotate-90' : ''}`}
              />
            </button>

          </div>
        )}

        {navCollapsed && <div className="flex-1" />}

        {/* Desno: toggle + odjava */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <button
            onClick={() => setNavCollapsed(!navCollapsed)}
            className="p-0.5 rounded hover:bg-gray-100 transition-all"
            title={navCollapsed ? 'Prikaži navigaciju' : 'Sakrij navigaciju'}
          >
            {navCollapsed
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              : <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
            }
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-white text-xs px-2 py-1 rounded transition-all"
            style={{ backgroundColor: PRIMARY }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6a4f8a')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PRIMARY)}
            title="Odjava"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Odjava</span>
          </button>
        </div>
      </div>

      {/* ─── PODMENI KLIŠEA ─── */}
      {kliseaOpen && (
        <div
          className="flex-shrink-0 bg-white flex items-center gap-0.5 px-2 py-1 border-b border-gray-200"
          style={{ borderLeft: `3px solid ${PRIMARY}` }}
        >
          <Layers className="w-3 h-3 mr-1 opacity-40" style={{ color: PRIMARY }} />
          {kliseaSubmenu.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSection(sub.id as MenuSection)}
              className={`px-2 py-0.5 rounded text-xs whitespace-nowrap transition-all ${
                activeSection === sub.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={activeSection === sub.id ? { backgroundColor: SECONDARY } : {}}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── SADRŽAJ ─── */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white">
        {activeSection !== null && renderContent()}
      </main>
    </div>
  );
}
