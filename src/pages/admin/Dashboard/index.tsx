import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Fish,
  ShoppingBag,
  Sprout,
  Coins,
  ArrowRight,
  Clock,
  ChevronRight,
  Building2,
  Anchor,
  Activity
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { DashboardMetrics, BuyerOrder, SellerLot, ActivityLogItem } from '../../../types/admin';
import { AdminStatusBadge } from '../../../components/admin/AdminStatusBadge';
import { formatTaka, toBanglaDigits } from '../../../utils/formatters';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<BuyerOrder[]>([]);
  const [recentLots, setRecentLots] = useState<SellerLot[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  useEffect(() => {
    setMetrics(adminService.getDashboardMetrics());
    setRecentOrders(adminService.getBuyerOrders().slice(0, 5));
    setRecentLots(adminService.getSellerLots().slice(0, 5));
    setActivityLogs(adminService.getActivityLogs().slice(0, 5));
  }, []);

  if (!metrics) return null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 4 Clean & Focused Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Live Stock */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">লাইভ মাছের স্টক</span>
            <div className="w-7.5 h-7.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Fish className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-serifBangla text-slate-900">
              {toBanglaDigits(metrics.liveStocks)}{' '}
              <span className="text-xs font-normal text-slate-500">টি প্রজাতি</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>মোট পোস্ট: <strong className="text-slate-700">{toBanglaDigits(metrics.totalStocks)}</strong></span>
              <span>·</span>
              <span>আসন্ন: <strong className="text-blue-600">{toBanglaDigits(metrics.upcomingStocks)}</strong></span>
            </div>
          </div>
          <Link
            to="/admin/stocks"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between"
          >
            <span>স্টক ইনভেন্টরি দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Pending Orders */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">অপেক্ষমাণ বায়ার চাহিদা</span>
            <div className="w-7.5 h-7.5 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-serifBangla text-slate-900">
              {toBanglaDigits(metrics.pendingRequirementsCount)}{' '}
              <span className="text-xs font-normal text-slate-500">টি প্রস্তাব</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
              <span>চলমান: <strong className="text-slate-700">{toBanglaDigits(metrics.activeOrdersCount)}</strong></span>
              <span>·</span>
              <span>সম্পন্ন: <strong className="text-emerald-600">{toBanglaDigits(metrics.completedOrdersCount)}</strong></span>
            </div>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-amber-700 hover:text-amber-800 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between"
          >
            <span>কোটেশন পর্যালোচনা</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Supplier Lots */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">ঘাট সরবরাহ প্রস্তাব</span>
            <div className="w-7.5 h-7.5 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Sprout className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-serifBangla text-slate-900">
              {toBanglaDigits(metrics.pendingSellerLotsCount)}{' '}
              <span className="text-xs font-normal text-slate-500">নতুন লট</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              জেলে ও খামারিদের সরাসরি সরবরাহ প্রস্তাব
            </div>
          </div>
          <Link
            to="/admin/submissions"
            className="text-xs text-teal-700 hover:text-teal-800 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between"
          >
            <span>যাচাই ও স্টকে রূপান্তর</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 4: Procurement Funds */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">মাছ সংগ্রহ তহবিল</span>
            <div className="w-7.5 h-7.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold font-serifBangla text-slate-900">
              {formatTaka(metrics.totalPledgedAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {toBanglaDigits(metrics.totalInvestmentPledges)} জন বিনিয়োগকারীর তহবিল
            </div>
          </div>
          <Link
            to="/admin/investments"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between"
          >
            <span>তহবিল ও আবেদন দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. Actionable Queues: Buyer Orders & Sourcing Lots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Left: Pending Buyer Requirements */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900 font-serifBangla">
                অপেক্ষমাণ করপোরেট চাহিদাপত্র
              </h2>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              সবগুলো ({recentOrders.length})
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                      {order.companyName}
                    </span>
                    <AdminStatusBadge status={order.orderStatus} />
                  </div>
                  <div className="text-slate-500 flex items-center gap-2">
                    <span className="text-slate-800 font-medium">{order.productName}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-600">{toBanglaDigits(order.quantity)} {order.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {order.contactPerson} ({order.phone})
                  </div>
                </div>

                <Link
                  to={`/admin/orders?id=${order.id}`}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
                >
                  কোটেশন
                </Link>
              </div>
            ))}

            {recentOrders.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                কোনো নতুন অপেক্ষমাণ চাহিদা নেই
              </div>
            )}
          </div>
        </div>

        {/* Right: Sourcing Lots */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900 font-serifBangla">
                ঘাট থেকে প্রাপ্ত সরবরাহ প্রস্তাব
              </h2>
            </div>
            <Link
              to="/admin/submissions"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              সবগুলো ({recentLots.length})
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentLots.map((lot) => (
              <div
                key={lot.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                      {lot.farmerName}
                    </span>
                    <AdminStatusBadge status={lot.verificationStatus} />
                  </div>
                  <div className="text-slate-500 flex items-center gap-2">
                    <span className="text-slate-800 font-medium">{lot.productName}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-600">{toBanglaDigits(lot.quantity)} {lot.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ঘাট: {lot.location}, {lot.district}
                  </div>
                </div>

                <Link
                  to="/admin/submissions"
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-colors"
                >
                  যাচাই
                </Link>
              </div>
            ))}

            {recentLots.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                কোনো নতুন সরবরাহ প্রস্তাব নেই
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Minimal System Audit Feed */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 font-serifBangla">
              সাম্প্রতিক প্ল্যাটফর্ম কার্যক্রম (Audit Trail)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">লাইভ অ্যাক্টিভিটি</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {activityLogs.map((log) => (
            <div key={log.id} className="py-2 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span className="font-medium text-slate-800">{log.action}:</span>
                <span className="text-slate-500 truncate">{log.targetTitle}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 font-mono">
                <span>{log.actor}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(log.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
