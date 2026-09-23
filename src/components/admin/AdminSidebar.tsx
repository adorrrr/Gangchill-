import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Fish,
  ShoppingBag,
  Sprout,
  Coins,
  BookOpen,
  Settings,
  ExternalLink,
  LogOut,
  X
} from 'lucide-react';
import { authService } from '../../services/authService';
import { AdminUser } from '../../types/admin';

interface AdminSidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  pendingRequirementsCount?: number;
  pendingSellerLotsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onCloseMobile,
  pendingRequirementsCount = 0,
  pendingSellerLotsCount = 0
}) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('admin_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('admin_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group
    ${isActive
      ? 'bg-blue-600/30 text-white font-semibold shadow-xs border border-blue-400/35'
      : 'text-slate-300 hover:text-white hover:bg-white/6'
    }
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container — Refined width with professional dark blue theme */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-[16.5rem] max-w-[85vw] bg-[#0B192C] text-slate-200 border-r border-slate-800
          flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="h-14 sm:h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0B192C]">
          <Link to="/admin" className="flex items-center group py-1">
            <img
              src="/gangchill-logo-admin.png"
              alt="Gangchill (গাংচিল)"
              className="h-[30px] sm:h-[32px] w-auto max-w-[135px] object-contain transition-transform duration-150 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items — Focused on 4 Core Business Areas */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 scrollbar-hide text-xs">
          {/* Overview */}
          <div className="space-y-1">
            <NavLink to="/admin" end className={navItemClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0 text-sky-400" />
                <span>ড্যাশবোর্ড</span>
              </div>
            </NavLink>
          </div>

          {/* Core 1: কিনুন (Buy) */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 pb-0.5 font-bold flex items-center justify-between">
              <span>১. কিনুন</span>
              <span className="text-[9px] text-slate-500 font-normal">BUY</span>
            </div>

            <NavLink to="/admin/stocks" className={navItemClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <Fish className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>মাছের স্টক ও ইনভেন্টরি</span>
              </div>
            </NavLink>

            <NavLink to="/admin/orders" className={navItemClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 shrink-0 text-amber-400" />
                <span>বায়ার ক্রয়াদেশ ও চাহিদা</span>
              </div>
              {pendingRequirementsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                  {pendingRequirementsCount}
                </span>
              )}
            </NavLink>
          </div>

          {/* Core 2: বিক্রি করুন (Sell) */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 pb-0.5 font-bold flex items-center justify-between">
              <span>২. বিক্রি করুন</span>
              <span className="text-[9px] text-slate-500 font-normal">SELL</span>
            </div>

            <NavLink to="/admin/submissions" className={navItemClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <Sprout className="w-4 h-4 shrink-0 text-teal-400" />
                <span>ঘাট সরবরাহ লট</span>
              </div>
              {pendingSellerLotsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  {pendingSellerLotsCount}
                </span>
              )}
            </NavLink>
          </div>

          {/* Core 3: বিনিয়োগ করুন (Invest) */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 pb-0.5 font-bold flex items-center justify-between">
              <span>৩. বিনিয়োগ করুন</span>
              <span className="text-[9px] text-slate-500 font-normal">INVEST</span>
            </div>

            <NavLink to="/admin/investments" className={navItemClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <Coins className="w-4 h-4 shrink-0 text-yellow-400" />
                <span>মৎস্য তহবিল ও আবেদন</span>
              </div>
            </NavLink>
          </div>

          {/* Core 4: ব্লগ (Blog) */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 pb-0.5 font-bold flex items-center justify-between">
              <span>৪. ব্লগ</span>
              <span className="text-[9px] text-slate-500 font-normal">BLOG</span>
            </div>

            <NavLink to="/admin/blog" className={navItemClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 shrink-0 text-purple-400" />
                <span>ব্লগ ও আর্টিকেল</span>
              </div>
            </NavLink>
          </div>

          {/* Settings */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <NavLink to="/admin/settings" className={navItemClass} onClick={onCloseMobile}>
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 shrink-0 text-slate-400" />
                <span>প্ল্যাটফর্ম সেটিংস</span>
              </div>
            </NavLink>
          </div>
        </nav>

        {/* Footer: Public Site Link & User Mini Card */}
        <div className="p-3 border-t border-slate-800 bg-[#071322] space-y-2 shrink-0">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/6 border border-white/5 hover:border-slate-700 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
              <span>মূল ওয়েবসাইট</span>
            </span>
            <span className="text-[10px] font-mono text-sky-400 font-semibold">Live ↗</span>
          </Link>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 min-w-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {currentUser?.name?.includes('MD') ? 'MD' : (currentUser?.name?.slice(0, 2) || 'AD')}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {currentUser?.name || 'MD Admin'}
                </div>
                <div className="text-[10px] text-sky-400 font-medium truncate">
                  {currentUser?.designation || 'সুপার অ্যাডমিন'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="লগআউট করুন"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
