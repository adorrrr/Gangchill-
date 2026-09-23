import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { authService } from '../../../services/authService';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  useEffect(() => {
    document.title = 'অ্যাডমিন লগইন | Gangchill Admin';
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!email.trim() || !password) {
      setError('ইমেইল ও পাসওয়ার্ড উভয়ই প্রদান করতে হবে।');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'লগইন ব্যর্থ হয়েছে।');
        // Check if blocked
        if (res.error?.includes('১০ মিনিটের জন্য')) {
          setLockoutSeconds(600);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const isLockedOut = lockoutSeconds > 0;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 flex flex-col justify-center items-center p-4 relative selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block group">
            <img
              src="/gangchill-logo-navbar.png"
              alt="Gangchill"
              className="h-11 w-auto mx-auto object-contain drop-shadow-xs"
            />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serifBangla text-slate-900 tracking-wide">
              অ্যাডমিন পোর্টাল লগইন
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              গাংচিল পাইকারি মাছের বাণিজ্যিক প্ল্যাটফর্ম পরিচালনা
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-5">
          {/* Lockout Banner */}
          {isLockedOut ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                <span>অ্যাকাউন্ট সাময়িকভাবে লক রয়েছে</span>
              </div>
              <p className="leading-relaxed">
                অতিরিক্ত ভুল প্রচেষ্টার কারণে লগইন স্থগিত রয়েছে। অনুগ্রহ করে অপেক্ষা করুন:
              </p>
              <div className="text-sm font-mono font-bold text-amber-950 bg-amber-100/70 px-2.5 py-1 rounded-md inline-block">
                অবশিষ্ট সময়: {formatCountdown(lockoutSeconds)} মিনিট
              </div>
            </div>
          ) : error ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">অ্যাডমিন ইমেইল</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={isLockedOut || loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার নিবন্ধিত ইমেইল লিখুন"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white bg-slate-50 text-slate-900 placeholder-slate-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-slate-700">সিক্রেট পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  disabled={isLockedOut || loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white bg-slate-50 text-slate-900 placeholder-slate-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isLockedOut}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'যাচাই হচ্ছে...' : isLockedOut ? 'লকড রয়েছে' : 'লগইন করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              to="/"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              ← মূল ওয়েবসাইটে ফিরে যান
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>সুরক্ষিত বাণিজ্যিক ডেটাবেজ ও ব্রুট-ফোর্স প্রটেকশন সক্রিয়</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
