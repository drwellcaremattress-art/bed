import { type FormEvent, useState } from 'react';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onLogin: (passcode: string) => Promise<void>;
  onBack: () => void;
}

export function AdminLoginPage({ onLogin, onBack }: AdminLoginPageProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(passcode);
      setPasscode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EE] flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-[#E6E4DE] bg-[#FAFAF8]">
        <span className="font-serif text-xl font-semibold text-[#18181B] tracking-tight">
          Teak-In-Furnitures
        </span>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#18181B] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to store
        </button>
      </div>

      {/* Centred card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Lock icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#1F3A2E] flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
          </div>

          <h1 className="font-serif text-3xl font-semibold text-[#18181B] text-center mb-1">
            Workshop Access
          </h1>
          <p className="text-sm text-[#57534E] text-center mb-8">
            Enter the workshop passcode to manage inventory, orders and the product catalogue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-passcode"
                className="block text-xs font-semibold text-[#18181B] mb-1.5"
              >
                Workshop passcode
              </label>
              <input
                id="admin-passcode"
                type="password"
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                required
                className="w-full h-11 px-3.5 rounded-lg border border-[#D6D3CE] bg-white text-sm text-[#18181B] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !passcode}
              className="w-full h-11 rounded-lg bg-[#1F3A2E] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#162920] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" aria-hidden="true" />
              )}
              {loading ? 'Signing in…' : 'Enter workshop'}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-[#A8A29E]">
            Teak-In-Furnitures · Workshop admin portal
          </p>
        </div>
      </div>
    </div>
  );
}
