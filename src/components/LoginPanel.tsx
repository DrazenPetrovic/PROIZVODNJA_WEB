import { useState, useRef, useEffect } from 'react';
import { signIn, signInByToken } from '../utils/auth';
import { KeyRound, CreditCard, User, Lock } from 'lucide-react';

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

type LoginTab = 'credentials' | 'token';

export function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [tab, setTab] = useState<LoginTab>('credentials');

  // Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Token
  const [rfidToken, setRfidToken] = useState('');
  const tokenInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-focus token input when switching to token tab
  useEffect(() => {
    if (tab === 'token') {
      setTimeout(() => tokenInputRef.current?.focus(), 50);
    }
  }, [tab]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signIn(username.trim(), password.trim());
      if (signInError) {
        setError(signInError.message || 'Pogrešno korisničko ime ili lozinka');
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      setError(`Greška: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Called on Enter or when token reaches expected length (10 chars for 125kHz EM4100)
  const handleTokenSubmit = async (tokenValue: string) => {
    const trimmed = tokenValue.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signInByToken(trimmed);
      if (signInError) {
        setError(signInError.message || 'Nepoznat token');
        setRfidToken('');
        setTimeout(() => tokenInputRef.current?.focus(), 50);
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      setError(`Greška: ${err instanceof Error ? err.message : String(err)}`);
      setRfidToken('');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTokenSubmit(rfidToken);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRfidToken(val);
    // 125kHz EM4100 readers typically output 10 hex chars + CR
    // Auto-submit when value looks complete (10+ chars, reader sent data)
    if (val.length >= 10) {
      handleTokenSubmit(val);
    }
  };

  const PRIMARY = '#785E9E';
  const PRIMARY_DARK = '#6a4f8a';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center" style={{ borderBottom: `3px solid ${PRIMARY}` }}>
            <div className="flex justify-center mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: PRIMARY }}
              >
                <KeyRound className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-lg font-bold" style={{ color: PRIMARY }}>
              Prijava — Proizvodnja
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setTab('credentials'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                tab === 'credentials'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={tab === 'credentials' ? { backgroundColor: PRIMARY } : {}}
            >
              <User className="w-4 h-4" />
              Korisnik / Šifra
            </button>
            <button
              onClick={() => { setTab('token'); setError(''); setRfidToken(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                tab === 'token'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              style={tab === 'token' ? { backgroundColor: PRIMARY } : {}}
            >
              <CreditCard className="w-4 h-4" />
              Prijava tokenom
            </button>
          </div>

          <div className="p-5">
            {/* CREDENTIALS TAB */}
            {tab === 'credentials' && (
              <form onSubmit={handleCredentialsLogin} autoComplete="on" className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Korisničko ime
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Korisničko ime"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition"
                      onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                      onBlur={(e) => (e.target.style.borderColor = 'rgb(209 213 219)')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Lozinka
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Lozinka"
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none transition"
                      onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                      onBlur={(e) => (e.target.style.borderColor = 'rgb(209 213 219)')}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-semibold py-2.5 text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: PRIMARY }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PRIMARY_DARK)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PRIMARY)}
                >
                  {loading ? 'Prijava u toku...' : 'Prijava'}
                </button>
              </form>
            )}

            {/* TOKEN TAB */}
            {tab === 'token' && (
              <div className="space-y-3">
                <div
                  className="rounded-xl p-4 text-center border-2 border-dashed"
                  style={{ borderColor: `${PRIMARY}55`, backgroundColor: `${PRIMARY}08` }}
                >
                  <CreditCard className="w-10 h-10 mx-auto mb-2" style={{ color: PRIMARY }} />
                  <p className="text-xs text-gray-600 font-medium">
                    Prislonite 125kHz token čitaču
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ili unesite kod ručno i pritisnite Enter
                  </p>
                </div>

                <div className="relative">
                  <input
                    ref={tokenInputRef}
                    type="text"
                    value={rfidToken}
                    onChange={handleTokenChange}
                    onKeyDown={handleTokenKeyDown}
                    placeholder="Čeka token..."
                    disabled={loading}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none text-center tracking-widest font-mono disabled:opacity-50"
                    onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                    onBlur={(e) => (e.target.style.borderColor = 'rgb(209 213 219)')}
                    autoComplete="off"
                  />
                </div>

                {loading && (
                  <div className="text-center text-xs text-gray-500">
                    Provjera tokena...
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs text-center">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  disabled={loading || !rfidToken.trim()}
                  onClick={() => handleTokenSubmit(rfidToken)}
                  className="w-full text-white font-semibold py-2.5 text-sm rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: PRIMARY }}
                  onMouseEnter={(e) => !loading && rfidToken.trim() && (e.currentTarget.style.backgroundColor = PRIMARY_DARK)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PRIMARY)}
                >
                  Prijava tokenom
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
