import React, { useState, useEffect } from 'react';
import { Menu, Plus, Bell, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { AdminUser } from '../../types/admin';

interface AdminTopbarProps {
  onToggleMobileSidebar: () => void;
  pendingCount?: number;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onToggleMobileSidebar,
  pendingCount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Determine Title & Subtitle based on path
  const getPageHeader = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') {
      return {
        title: 'ড্যাশবোর্ড',
        subtitle: 'দৈনিক ইনভেন্টরি, অর্ডার ও সরবরাহ কার্যক্রমের সারসংক্ষেপ'
      };
    }
    if (path.startsWith('/admin/stocks/new')) {
      return {
        title: 'নতুন স্টক যুক্ত করুন',
        subtitle: 'মাছের নতুন লট ইনভেন্টরি ও বিস্তারিত বিবরণ'
      };
    }
    if (path.includes('/edit') && path.includes('/stocks')) {
      return {
        title: 'স্টক সম্পাদনা',
        subtitle: 'মাছের বিবরণ, মূল্য ও মজুত আপডেট'
      };
    }
    if (path.startsWith('/admin/stocks')) {
      return {
        title: 'মাছের স্টক ইনভেন্টরি',
        subtitle: 'লাইভ ও আসন্ন পাইকারি মাছের মজুত ব্যবস্থাপনা'
      };
    }
    if (path.startsWith('/admin/orders')) {
      return {
        title: 'পাইকারি চাহিদা ও ক্রয়াদেশ',
        subtitle: 'করপোরেট ক্রেতাদের চাহিদা, কোটেশন ও স্ট্যাটাস ট্র্যাকিং'
      };
    }
    if (path.startsWith('/admin/submissions')) {
      return {
        title: 'ঘাট ও ঘের সরবরাহ লট',
        subtitle: 'জেলে ও খামারিদের সরাসরি সরবরাহ প্রস্তাব ও যাচাইকরণ'
      };
    }
    if (path.startsWith('/admin/investments')) {
      return {
        title: 'মৎস্য তহবিল ও বিনিয়োগ',
        subtitle: 'মৌসুমি সোর্সিং ফান্ড প্রকল্প ও বিনিয়োগকারীদের আবেদন'
      };
    }
    if (path.startsWith('/admin/customers')) {
      return {
        title: 'করপোরেট বায়ার ডিরেক্টরি',
        subtitle: 'ক্লায়েন্ট প্রোফাইল, ব্যবসায়িক হিসাব ও ক্রয়াদেশের ইতিহাস'
      };
    }
    if (path.startsWith('/admin/sellers')) {
      return {
        title: 'জেলে ও ঘাট সরবরাহকারী নেটওয়ার্ক',
        subtitle: 'নিবন্ধিত জেলে সমবায়, ট্রলার মালিক ও মাছ খামারিদের তথ্যভাণ্ডার'
      };
    }
    if (path.startsWith('/admin/blog/new')) {
      return {
        title: 'নতুন ব্লগ আর্টিকেল রচনা',
        subtitle: 'নলেজবেস ও মৎস্য বাণিজ্য নির্দেশিকা প্রকাশ'
      };
    }
    if (path.startsWith('/admin/blog')) {
      return {
        title: 'ব্লগ ও কনটেন্ট ম্যানেজমেন্ট',
        subtitle: 'নিবন্ধ প্রকাশ, সম্পাদনা ও ক্যাটাগরি ব্যবস্থাপনা'
      };
    }
    if (path.startsWith('/admin/reports')) {
      return {
        title: 'রিপোর্ট ও পরিসংখ্যান',
        subtitle: 'বাণিজ্যিক বিশ্লেষণ, প্রকিউরমেন্ট ভলিউম ও আর্থিক পারফরম্যান্স'
      };
    }
    if (path.startsWith('/admin/settings')) {
      return {
        title: 'প্ল্যাটফর্ম কনফিগারেশন',
        subtitle: 'কোম্পানি তথ্য, পলিসি, হাব সেটিংস ও সিস্টেম অ্যাডমিন'
      };
    }
    return {
      title: 'ড্যাশবোর্ড',
      subtitle: 'দৈনিক ইনভেন্টরি, অর্ডার ও সরবরাহ কার্যক্রমের সারসংক্ষেপ'
    };
  };

  const header = getPageHeader();

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page Header Info */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer transition-colors shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold font-serifBangla text-slate-900 leading-tight truncate">
            {header.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate mt-0.5">
            {header.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions & User area */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick action button */}
        <Link
          to="/admin/stocks/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>নতুন স্টক যুক্ত করুন</span>
        </Link>

        {/* Notifications Icon with pending count */}
        <Link
          to="/admin/orders"
          className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shrink-0"
          title="নতুন অপেক্ষমাণ চাহিদা"
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold flex items-center justify-center animate-pulse">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* User Mini Dropdown / Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {currentUser?.name?.includes('MD') ? 'MD' : (currentUser?.name?.slice(0, 2) || 'AD')}
            </div>
          )}
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">
              {currentUser?.name || 'MD Admin'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
              <span className="text-blue-600 font-semibold">{currentUser?.designation || 'সুপার অ্যাডমিন'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-mono">অনলাইন</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="লগআউট"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
