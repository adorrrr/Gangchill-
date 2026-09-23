import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/Home';
import { BuyPage } from './pages/Buy';
import { StockDetailPage } from './pages/StockDetail';
import { SellPage } from './pages/Sell';
import { InvestPage } from './pages/Invest';
import { InvestmentDetailPage } from './pages/InvestmentDetail';
import { ContactPage } from './pages/Contact';
import { BlogPage } from './pages/Blog';
import { BlogArticlePage } from './pages/BlogArticle';
import { NotFoundPage } from './pages/NotFound';

import { AdminRouteGuard } from './components/admin/AdminRouteGuard';

// Lazy-loaded Admin Pages & Layout for Bundle Optimization
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLoginPage = React.lazy(() => import('./pages/admin/Login').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = React.lazy(() => import('./pages/admin/Dashboard').then(m => ({ default: m.AdminDashboardPage })));
const AdminStocksPage = React.lazy(() => import('./pages/admin/Stocks').then(m => ({ default: m.AdminStocksPage })));
const AdminStockEditPage = React.lazy(() => import('./pages/admin/StockEdit').then(m => ({ default: m.AdminStockEditPage })));
const AdminOrdersPage = React.lazy(() => import('./pages/admin/Orders').then(m => ({ default: m.AdminOrdersPage })));
const AdminSubmissionsPage = React.lazy(() => import('./pages/admin/Submissions').then(m => ({ default: m.AdminSubmissionsPage })));
const AdminInvestmentsPage = React.lazy(() => import('./pages/admin/Investments').then(m => ({ default: m.AdminInvestmentsPage })));
const AdminCustomersPage = React.lazy(() => import('./pages/admin/Customers').then(m => ({ default: m.AdminCustomersPage })));
const AdminSellersPage = React.lazy(() => import('./pages/admin/Sellers').then(m => ({ default: m.AdminSellersPage })));
const AdminBlogPage = React.lazy(() => import('./pages/admin/Blog').then(m => ({ default: m.AdminBlogPage })));
const AdminBlogEditPage = React.lazy(() => import('./pages/admin/BlogEdit').then(m => ({ default: m.AdminBlogEditPage })));
const AdminReportsPage = React.lazy(() => import('./pages/admin/Reports').then(m => ({ default: m.AdminReportsPage })));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/Settings').then(m => ({ default: m.AdminSettingsPage })));

const AdminLoadingFallback: React.FC = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
    <div className="w-10 h-10 border-3 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mb-3"></div>
    <p className="text-slate-400 text-xs tracking-wider">লোড হচ্ছে...</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Login (Standalone Clean View without navbar/footer) */}
        <Route
          path="/admin/login"
          element={
            <React.Suspense fallback={<AdminLoadingFallback />}>
              <AdminLoginPage />
            </React.Suspense>
          }
        />

        {/* Protected Admin Suite Routes */}
        <Route
          path="/admin"
          element={
            <AdminRouteGuard>
              <React.Suspense fallback={<AdminLoadingFallback />}>
                <AdminLayout />
              </React.Suspense>
            </AdminRouteGuard>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="stocks" element={<AdminStocksPage />} />
          <Route path="stocks/new" element={<AdminStockEditPage />} />
          <Route path="stocks/:id/edit" element={<AdminStockEditPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="submissions" element={<AdminSubmissionsPage />} />
          <Route path="investments" element={<AdminInvestmentsPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="sellers" element={<AdminSellersPage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="blog/new" element={<AdminBlogEditPage />} />
          <Route path="blog/:slug/edit" element={<AdminBlogEditPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Public Website Routes (Wrapped with MainLayout & Water Atmosphere) */}
        <Route
          element={
            <MainLayout>
              <Outlet />
            </MainLayout>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/stock/:slug" element={<StockDetailPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />
          <Route path="/invest" element={<InvestPage />} />
          <Route path="/invest/:slug" element={<InvestmentDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
