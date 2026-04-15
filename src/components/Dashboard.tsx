import { useState } from 'react';
import {
  LogOut,
  ClipboardList,
  Package,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
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
  | 'zaposleni'
  | 'klisea'
  | null;

const PRIMARY = '#785E9E';

export function Dashboard({ username, vrstaRadnika, onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<MenuSection>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);

  const vrsta = Number(vrstaRadnika);

  const allMenuItems = [
    { id: 'radni_nalozi', label: 'Radni nalozi', icon: ClipboardList, color: 'text-blue-600',   bg: 'bg-blue-50' },
    { id: 'materijali',   label: 'Materijali',   icon: Package,       color: 'text-green-600',  bg: 'bg-green-50' },
    { id: 'zaposleni',    label: 'Zaposleni',    icon: Users,         color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'klisea',       label: 'Klišea',       icon: Layers,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const renderContent = () => {
    if (!activeSection) return null;
    const labels: Record<Exclude<MenuSection, null>, string> = {
      radni_nalozi: 'Radni nalozi',
      materijali:   'Materijali',
      zaposleni:    'Zaposleni',
      klisea:       'Klišea',
    };
    return (
      <div className="p-2">
        <h2 className="text-base font-semibold mb-2" style={{ color: PRIMARY }}>
          {labels[activeSection]}
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

      {/* ─── TOP BAR ─── kompaktan, sve u jednom redu ─── */}
      <div
        className="flex-shrink-0 bg-white flex items-center gap-1 px-2"
        style={{ borderBottom: `2px solid ${PRIMARY}`, height: '36px', minHeight: '36px' }}
      >
        {/* Logo + naziv firme */}
        <Factory className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
        <span className="font-bold text-sm whitespace-nowrap" style={{ color: PRIMARY }}>
          Proizvodnja
        </span>

        <span className="text-gray-300 mx-1 text-xs">|</span>

        {/* NAV DUGMAD — horizontalno, skrivaju se ako je kolaps */}
        {!navCollapsed && (
          <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
            {allMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as MenuSection)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={isActive ? { backgroundColor: PRIMARY } : {}}
                  title={item.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {navCollapsed && <div className="flex-1" />}

        {/* Desno: korisnik + toggle + odjava */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <span className="text-xs text-gray-500 whitespace-nowrap hidden md:inline">
            <span style={{ color: PRIMARY }} className="font-medium">{username}</span>
          </span>

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

      {/* ─── SADRŽAJ ─── zauzima ostatak ekrana ─── */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white">
        {activeSection !== null && renderContent()}
      </main>
    </div>
  );
}
