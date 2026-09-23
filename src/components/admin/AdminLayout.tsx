import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { adminService } from '../../services/adminService';

const ADMIN_TITLES: Record<string, string> = {
  '/admin': 'অ্যাডমিন ড্যাশবোর্ড | Gangchill Admin',
  '/admin/stocks': 'মাছের স্টক ব্যবস্থাপনা | Gangchill Admin',
  '/admin/stocks/new': 'নতুন স্টক যুক্ত করুন | Gangchill Admin',
  '/admin/orders': 'অর্ডার ও কর্পোরেট চাহিদা | Gangchill Admin',
  '/admin/submissions': 'সাপ্লায়ার লট সাবমিশন | Gangchill Admin',
  '/admin/investments': 'বিনিয়োগ প্রকল্প ব্যবস্থাপনা | Gangchill Admin',
  '/admin/customers': 'ক্রেতা ও লিড ব্যবস্থাপনা | Gangchill Admin',
  '/admin/sellers': 'সাপ্লায়ার ও খামারি তালিকা | Gangchill Admin',
  '/admin/blog': 'ব্লগ ম্যানেজমেন্ট | Gangchill Admin',
  '/admin/blog/new': 'নতুন ব্লগ আর্টিকেল | Gangchill Admin',
  '/admin/reports': 'বাণিজ্যিক রিপোর্ট ও অ্যানালিটিক্স | Gangchill Admin',
  '/admin/settings': 'সিস্টেম সেটিংস | Gangchill Admin',
};

export const AdminLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [pendingReqCount, setPendingReqCount] = useState(0);
  const [pendingLotsCount, setPendingLotsCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Refresh counts on route changes
    const metrics = adminService.getDashboardMetrics();
    setPendingReqCount(metrics.pendingRequirementsCount);
    setPendingLotsCount(metrics.pendingSellerLotsCount);
    setIsMobileSidebarOpen(false);

    // Dynamic browser tab title for Admin Suite
    const path = location.pathname.replace(/\/$/, '');
    let title = ADMIN_TITLES[path];
    if (!title) {
      if (path.startsWith('/admin/stocks/') && path.endsWith('/edit')) {
        title = 'স্টক সম্পাদনা | Gangchill Admin';
      } else if (path.startsWith('/admin/blog/') && path.endsWith('/edit')) {
        title = 'ব্লগ আর্টিকেল সম্পাদনা | Gangchill Admin';
      } else {
        title = 'অ্যাডমিন প্যানেল | Gangchill Admin';
      }
    }
    document.title = title;

    // Ensure search engines do not index admin routes
    let robotsEl = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsEl) {
      robotsEl = document.createElement('meta');
      robotsEl.name = 'robots';
      document.head.appendChild(robotsEl);
    }
    robotsEl.content = 'noindex, nofollow';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex antialiased selection:bg-blue-600 selection:text-white">
      {/* Responsive Left Sidebar */}
      <AdminSidebar
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingRequirementsCount={pendingReqCount}
        pendingSellerLotsCount={pendingLotsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[16.5rem] transition-all duration-300">
        {/* Sticky Topbar */}
        <AdminTopbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          pendingCount={pendingReqCount + pendingLotsCount}
        />

        {/* Page Viewport */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
