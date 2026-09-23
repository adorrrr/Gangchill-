import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DesktopHeader } from './DesktopHeader';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';
import { WaterAtmosphere } from '../effects/WaterAtmosphere';
import { adminService } from '../../services/adminService';
import { Phone } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const [platformSettings, setPlatformSettings] = useState(() => adminService.getSettings());

  // Fetch latest settings from server on initial mount
  useEffect(() => {
    adminService.fetchSettings().then((s) => {
      if (s) setPlatformSettings(s);
    }).catch(() => {});
  }, []);

  // Scroll restoration and settings sync on route navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    setPlatformSettings(adminService.getSettings());
  }, [pathname]);

  // Sync settings reactively
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setPlatformSettings(adminService.getSettings());
    };
    window.addEventListener('gangchill_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('gangchill_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const isMaintenanceMode = Boolean(platformSettings?.maintenanceMode);

  return (
    <div className="relative min-h-screen flex flex-col bg-gangchill-canvas text-gangchill-ink antialiased">
      {/* Skip to Content for Keyboard & Screen Reader Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gangchill-blue focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg focus:outline-none"
      >
        মূল বিষয়বস্তুতে যান (Skip to main content)
      </a>

      {/* Global Maintenance Mode Notification Banner for General Visitors */}
      {isMaintenanceMode && (
        <aside
          role="alert"
          aria-label="সিস্টেম রক্ষণাবেক্ষণ নোটিশ"
          className="sticky top-0 z-50 w-full bg-amber-500 text-slate-950 px-3.5 sm:px-6 py-2.5 sm:py-3 shadow-md border-b border-amber-600 font-sans animate-fade-in"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-bold text-xs shrink-0 shadow-xs">
                <span>⚠️</span>
                <span>রক্ষণাবেক্ষণ বিজ্ঞপ্তি</span>
              </span>
              <span className="leading-snug font-bold text-slate-950">
                {platformSettings?.maintenanceMessage || 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${platformSettings?.emergencyHotline || platformSettings?.supportPhone || '+8801711234567'}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-950 text-amber-300 hover:bg-slate-900 font-bold text-xs transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>জরুরি হেল্পলাইন: {platformSettings?.emergencyHotline || platformSettings?.supportPhone || '+880 1711-234567'}</span>
              </a>
            </div>
          </div>
        </aside>
      )}

      <WaterAtmosphere />
      <DesktopHeader />
      <MobileHeader />
      <main id="main-content" className="flex-1 w-full relative z-10 pb-36 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
