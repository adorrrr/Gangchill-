import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  Anchor,
  Building2,
  Fish,
  ShoppingBag,
  Coins,
  Users,
  Package,
  CheckCircle2,
  TrendingUp,
  Activity,
  FileText,
  Inbox
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export const AdminReportsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Load raw data from persistent storage
  const rawStocks = adminService.getStocks();
  const rawOrders = adminService.getBuyerOrders();
  const rawLots = adminService.getSellerLots();
  const rawInvestments = adminService.getInvestments();
  const rawInterests = adminService.getInvestorInterests();
  const rawBlogPosts = adminService.getBlogPosts();
  const rawActivities = adminService.getActivityLogs();

  // Helper to check if a date string falls into the selected time range
  const isWithinRange = (dateStr?: string): boolean => {
    if (!dateStr || timeRange === 'all') return true;
    const itemDate = new Date(dateStr).getTime();
    if (isNaN(itemDate)) return true;

    const now = Date.now();
    if (timeRange === 'today') {
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      return itemDate >= oneDayAgo;
    }
    if (timeRange === 'week') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      return itemDate >= sevenDaysAgo;
    }
    if (timeRange === 'month') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      return itemDate >= thirtyDaysAgo;
    }
    return true;
  };

  // Filter dynamic transactional data by selected time range
  const orders = useMemo(() => rawOrders.filter((o) => isWithinRange(o.createdAt)), [rawOrders, timeRange]);
  const lots = useMemo(() => rawLots.filter((l) => isWithinRange(l.createdAt)), [rawLots, timeRange]);
  const activities = useMemo(() => rawActivities.filter((a) => isWithinRange(a.timestamp)), [rawActivities, timeRange]);
  const interests = useMemo(() => rawInterests.filter((i) => isWithinRange(i.createdAt)), [rawInterests, timeRange]);

  // Static / Catalog counts (global inventory)
  const stocks = rawStocks;
  const investments = rawInvestments;
  const blogPosts = rawBlogPosts;

  // 1. User & Participant Counts
  const rawCustomers = adminService.getCustomers();
  const rawSuppliers = adminService.getSuppliers();
  const distinctBuyerCompanies = rawCustomers.length;
  const distinctSuppliers = rawSuppliers.length;
  const distinctInvestors = new Set(rawInterests.map((i) => i.phone.trim() || i.investorName.trim())).size;
  const totalSystemUsers = distinctBuyerCompanies + distinctSuppliers + distinctInvestors + 1; // +1 MD Admin

  // 2. Total Listings & Items
  const totalListingItems = stocks.length + investments.length + blogPosts.length;

  // 3. Stock Analytics
  const totalStockKg = stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalStockValue = stocks.reduce((sum, s) => sum + (Number(s.quantity) * (Number(s.price) || 0)), 0);
  const liveStocksCount = stocks.filter((s) => s.status === 'live').length;
  const upcomingStocksCount = stocks.filter((s) => s.status === 'upcoming').length;
  const soldStocksCount = stocks.filter((s) => s.status === 'sold').length;

  // 4. Order & Financial Analytics
  const completedOrders = orders.filter((o) => o.orderStatus === 'completed');
  const activeOrders = orders.filter(
    (o) => o.orderStatus === 'confirmed' || o.orderStatus === 'processing' || o.orderStatus === 'dispatched'
  );
  const pendingOrders = orders.filter(
    (o) => o.orderStatus === 'pending' || o.orderStatus === 'under_review' || o.orderStatus === 'quoted'
  );
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'cancelled');

  const totalRevenueRealized = completedOrders.reduce((sum, o) => sum + (o.totalEstimatedValue || 0), 0);
  const totalPipelineValue = orders.reduce((sum, o) => sum + (o.totalEstimatedValue || 0), 0);
  const orderFulfillmentRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0;

  // 5. Sourcing & Ghat Volume Analytics
  const verifiedLots = lots.filter((l) => l.verificationStatus === 'approved' || l.verificationStatus === 'verified');
  const totalSourcedKg = lots.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

  // Hub distribution breakdown
  const hubMap = useMemo(() => {
    const map = new Map<string, { count: number; kg: number }>();
    lots.forEach((l) => {
      const hub = l.district || l.location?.split(',')[0] || 'অন্যান্য';
      const cur = map.get(hub) || { count: 0, kg: 0 };
      cur.count += 1;
      cur.kg += Number(l.quantity) || 0;
      map.set(hub, cur);
    });
    return map;
  }, [lots]);

  // 6. Investment & Capital Fund Analytics
  const totalFundRaised = investments.reduce((sum, i) => sum + Number(i.raisedCapital || 0), 0);
  const totalFundTarget = investments.reduce((sum, i) => sum + Number(i.requiredCapital || 0), 0);
  const openInvestmentsCount = investments.filter((i) => i.status === 'open').length;
  const fundedInvestmentsCount = investments.filter((i) => i.status === 'funded').length;
  const closedInvestmentsCount = investments.filter((i) => i.status === 'closed').length;
  const fundCompletionRate = totalFundTarget > 0 ? Math.round((totalFundRaised / totalFundTarget) * 100) : 0;

  // 7. Blog CMS Content Breakdown
  const publishedBlogCount = blogPosts.filter((b) => Boolean(b.publishedAt)).length;
  const featuredBlogCount = blogPosts.filter((b) => Boolean(b.featured)).length;
  const standardBlogCount = blogPosts.length - featuredBlogCount;

  // CSV Export
  const handleExportCSV = () => {
    const timeLabel =
      timeRange === 'today' ? 'আজ' : timeRange === 'week' ? 'সপ্তাহ' : timeRange === 'month' ? 'চলতি মাস' : 'সর্বমোট ডাটা';

    const csvRows = [
      ['গ্যাংচিল প্ল্যাটফর্ম - অ্যানালিটিক্স ও এক্সিকিউটিভ রিপোর্ট'],
      ['রিপোর্ট তৈরির তারিখ', new Date().toLocaleString('bn-BD')],
      ['নির্বাচিত সময়কাল', timeLabel],
      [''],
      ['--- সার্বিক প্ল্যাটফর্ম সারাংশ ---'],
      ['মোট প্ল্যাটফর্ম ইউজার', `${totalSystemUsers} জন`, `ক্রেতা: ${distinctBuyerCompanies}, সরবরাহকারী: ${distinctSuppliers}, বিনিয়োগকারী: ${distinctInvestors}, অ্যাডমিন: ১`],
      ['মোট লিস্টিং আইটেম', `${totalListingItems} টি`, `মাছ: ${stocks.length}, তহবিল প্রকল্প: ${investments.length}, আর্টিকেল: ${blogPosts.length}`],
      ['মোট ফিজিক্যাল স্টক ওজন', `${totalStockKg.toLocaleString('bn-BD')} কেজি`, `${(totalStockKg / 1000).toFixed(2)} টন`],
      ['হোল্ডিং স্টক ভ্যালুয়েশন', `৳ ${totalStockValue.toLocaleString('bn-BD')}`, 'বর্তমান ইনভেন্টরি বাজারমূল্য'],
      ['মোট পাইকারি ক্রয়াদেশ', `${orders.length} টি`, 'নির্বাচিত সময়সীমায় প্রাপ্ত চাহিদা'],
      ['সম্পূর্ণ হওয়া অর্ডারের রাজস্ব', `৳ ${totalRevenueRealized.toLocaleString('bn-BD')}`, 'ক্যাশবুক রিলাইজড রেভিনিউ'],
      ['মোট পাইপলাইন অর্ডার মান', `৳ ${totalPipelineValue.toLocaleString('bn-BD')}`, 'চলতি ও প্রক্রিয়াধীন ক্রয়াদেশের মান'],
      ['অর্ডার রূপান্তর হার', `${orderFulfillmentRate}%`, 'সফলভাবে সম্পন্ন হওয়ার অনুপাত'],
      ['উপকূলীয় আহরিত মাছের ওজন', `${totalSourcedKg.toLocaleString('bn-BD')} কেজি`, `${(totalSourcedKg / 1000).toFixed(2)} টন সংগ্রহ`],
      ['যাচাইকৃত সরবরাহ লট', `${verifiedLots.length} টি`, `মোট ${lots.length} টি সাবমিশনের মধ্যে`],
      ['মৎস্য তহবিল সংগ্রহ', `৳ ${totalFundRaised.toLocaleString('bn-BD')}`, `টার্গেট ৳ ${totalFundTarget.toLocaleString('bn-BD')} (${fundCompletionRate}%)`],
      [''],
      ['--- পাইকারি ক্রয়াদেশের বিস্তারিত তালিকা ---'],
      ['অর্ডার নং', 'কোম্পানির নাম', 'মাছের নাম', 'পরিমাণ', 'কোটেশন রেট (প্রতি কেজি)', 'মোট অর্ডার মান (টাকা)', 'অর্ডার স্ট্যাটাস', 'তারিখ'],
      ...orders.map((ord) => [
        ord.id,
        ord.companyName,
        ord.productName,
        `${ord.quantity} ${ord.unit}`,
        ord.quotedPricePerUnit ? `৳${ord.quotedPricePerUnit}` : 'অনির্ধারিত',
        ord.totalEstimatedValue ? `৳${ord.totalEstimatedValue}` : '—',
        ord.orderStatus,
        ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('bn-BD') : '—'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.map((c) => `"${c}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gangchill_report_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 print:p-0 print:m-0">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 print:hidden">
        <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
          রিয়েল-টাইম প্ল্যাটফর্ম পারফরম্যান্স ও রিপোর্ট
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Toggle */}
          <div className="flex items-center p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-xl border border-slate-200 text-xs shadow-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                timeRange === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              আজ
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                timeRange === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সপ্তাহ
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                timeRange === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              চলতি মাস
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg font-medium text-xs transition-colors cursor-pointer ${
                timeRange === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সর্বমোট
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-xs cursor-pointer"
            title="সিএসভি ফাইল হিসেবে সম্পূর্ণ রিপোর্ট ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            CSV এক্সপোর্ট
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="রিপোর্টের প্রিন্ট বা পিডিএফ সংস্করণ তৈরি করুন"
          >
            <Printer className="w-3.5 h-3.5" />
            প্রিন্ট সামারি
          </button>
        </div>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Users */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-medium">
            <span>মোট প্ল্যাটফর্ম পার্টনার ও ইউজার</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">{totalSystemUsers} জন</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {distinctBuyerCompanies} বায়ার • {distinctSuppliers} খামারি • {distinctInvestors} বিনিয়োগকারী
            </p>
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>সিস্টেম নিয়ন্ত্রক</span>
            <span className="font-semibold text-blue-600">MD Admin (অনলাইন)</span>
          </div>
        </div>

        {/* Card 2: Total Listings & Catalog */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-medium">
            <span>মোট লিস্টিং ও আইটেম সংখ্যা</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">{totalListingItems} টি</p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {stocks.length} মাছের স্টক • {investments.length} তহবিল • {blogPosts.length} ব্লগ
            </p>
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>ইনভেন্টরি ওজন</span>
            <span className="font-semibold text-emerald-600 font-mono">{(totalStockKg / 1000).toFixed(1)} টন কোল্ড চেইন</span>
          </div>
        </div>

        {/* Card 3: Revenue & Orders Pipeline */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-medium">
            <span>সম্পন্ন রাজস্ব ও পাইপলাইন মান</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 font-bangla">
              ৳{(totalRevenueRealized / 100000).toFixed(2)} লাখ
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              পাইপলাইন: ৳{(totalPipelineValue / 100000).toFixed(2)} লাখ ({orders.length} অর্ডার)
            </p>
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>অর্ডার রূপান্তর হার</span>
            <span className="font-semibold text-cyan-700 font-mono">{orderFulfillmentRate}% সম্পন্ন</span>
          </div>
        </div>

        {/* Card 4: Coastal Sourcing Volume */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-[11px] sm:text-xs font-medium">
            <span>উপকূলীয় আহরণ ভলিউম</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Anchor className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {(totalSourcedKg / 1000).toFixed(2)} টন
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {verifiedLots.length} যাচাইকৃত লট ({lots.length} টির মধ্যে)
            </p>
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>সক্রিয় ঘাট হাব</span>
            <span className="font-semibold text-indigo-600">{hubMap.size} টি আঞ্চলিক হাব</span>
          </div>
        </div>
      </div>

      {/* Active vs Inactive Content Status Meter (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 1. Fish Stocks Breakdown */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
              <Fish className="w-3.5 h-3.5 text-blue-600" />
              মাছের স্টক সক্রিয়তা
            </h3>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">{stocks.length} টি পোস্ট</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-700 font-medium">লাইভ: {liveStocksCount}</span>
              <span className="text-amber-700 font-medium">আপকামিং: {upcomingStocksCount}</span>
              <span className="text-slate-500 font-medium">স্টক শেষ: {soldStocksCount}</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${stocks.length > 0 ? (liveStocksCount / stocks.length) * 100 : 0}%` }}
                className="bg-emerald-500 h-full"
                title="লাইভ স্টক"
              />
              <div
                style={{ width: `${stocks.length > 0 ? (upcomingStocksCount / stocks.length) * 100 : 0}%` }}
                className="bg-amber-400 h-full"
                title="আপকামিং স্টক"
              />
              <div
                style={{ width: `${stocks.length > 0 ? (soldStocksCount / stocks.length) * 100 : 0}%` }}
                className="bg-slate-300 h-full"
                title="স্টক আউট"
              />
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">
              মোট ইনভেন্টরি মূল্যমান: ৳{(totalStockValue / 100000).toFixed(1)} লাখ
            </p>
          </div>
        </div>

        {/* 2. Investments Fund Breakdown */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              মৎস্য তহবিল প্রকল্প স্থিতি
            </h3>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">{investments.length} টি প্রকল্প</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-blue-700 font-medium">উন্মুক্ত: {openInvestmentsCount}</span>
              <span className="text-emerald-700 font-medium">সংগৃহীত: {fundedInvestmentsCount}</span>
              <span className="text-slate-500 font-medium">সমাপ্ত: {closedInvestmentsCount}</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${fundCompletionRate}%` }}
                className="bg-amber-500 h-full"
                title="তহবিল অগ্রগতি"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <span>সংগৃহীত: ৳{(totalFundRaised / 100000).toFixed(1)} লাখ ({interests.length} আবেদন)</span>
              <span className="font-semibold text-amber-600 font-mono">{fundCompletionRate}% পূরণ</span>
            </div>
          </div>
        </div>

        {/* 3. Blog CMS Content Breakdown */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase font-mono">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              ব্লগ ও নলেজবেস কনটেন্ট
            </h3>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">{blogPosts.length} টি আর্টিকেল</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-700 font-medium">লাইভ: {publishedBlogCount}</span>
              <span className="text-blue-700 font-medium">ফিচার্ড: {featuredBlogCount}</span>
              <span className="text-slate-500 font-medium">সাধারণ: {standardBlogCount}</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${blogPosts.length > 0 ? (featuredBlogCount / blogPosts.length) * 100 : 0}%` }}
                className="bg-amber-500 h-full"
                title="ফিচার্ড আর্টিকেল"
              />
              <div
                style={{ width: `${blogPosts.length > 0 ? (standardBlogCount / blogPosts.length) * 100 : 0}%` }}
                className="bg-blue-600 h-full"
                title="স্ট্যান্ডার্ড আর্টিকেল"
              />
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">
              মৎস্য বাণিজ্য, কোল্ড চেইন ও ইলিশের বাজার নিয়ে প্রকাশিত কন্টেন্ট
            </p>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: Order Funnel & Sourcing Hub Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Column 1: Order Lifecycle Pipeline Funnel */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-serifBangla flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              পাইকারি ক্রয়াদেশের রূপান্তর পাইপলাইন
            </h2>
            <span className="text-xs text-slate-400 font-mono">{orders.length} টি অর্ডার</span>
          </div>

          {orders.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400 space-y-1.5">
              <Inbox className="w-7 h-7 text-slate-300" />
              <p className="text-xs font-medium">নির্বাচিত সময়সীমায় কোনো ক্রয়াদেশ নেই</p>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {/* Stage 1 */}
              <div className="p-3 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono text-xs">
                    {pendingOrders.length}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">১. পেন্ডিং ও কোটেশন পর্যায়</h4>
                    <p className="text-slate-500 text-[11px]">চাহিদা যাচাই ও প্রকিউরমেন্ট কোটেশন প্রস্তুত</p>
                  </div>
                </div>
                <span className="text-amber-700 font-bold font-bangla text-xs">
                  ৳{(pendingOrders.reduce((acc, o) => acc + (o.totalEstimatedValue || 0), 0) / 100000).toFixed(1)} লাখ
                </span>
              </div>

              {/* Stage 2 */}
              <div className="p-3 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold font-mono text-xs">
                    {activeOrders.length}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">২. কনফার্মড ও ডেলিভারি চলমান</h4>
                    <p className="text-slate-500 text-[11px]">লট বরাদ্দ, বরফ প্যাকিং ও রেফার ভ্যানে পরিবহন</p>
                  </div>
                </div>
                <span className="text-blue-700 font-bold font-bangla text-xs">
                  ৳{(activeOrders.reduce((acc, o) => acc + (o.totalEstimatedValue || 0), 0) / 100000).toFixed(1)} লাখ
                </span>
              </div>

              {/* Stage 3 */}
              <div className="p-3 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono text-xs">
                    {completedOrders.length}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">৩. সম্পন্ন ও ক্যাশ সেটেলড</h4>
                    <p className="text-slate-500 text-[11px]">সফল ডেলিভারি ও ক্রেতা কর্তৃক প্রাপ্তি স্বীকার</p>
                  </div>
                </div>
                <span className="text-emerald-700 font-bold font-bangla text-xs">
                  ৳{(totalRevenueRealized / 100000).toFixed(1)} লাখ
                </span>
              </div>

              {/* Stage 4: Cancelled if any */}
              {cancelledOrders.length > 0 && (
                <div className="p-3 rounded-lg sm:rounded-xl bg-rose-50/60 border border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold font-mono text-xs">
                      {cancelledOrders.length}
                    </div>
                    <div>
                      <h4 className="font-semibold text-rose-900 text-xs">বাতিলকৃত চাহিদা</h4>
                      <p className="text-rose-600 text-[11px]">ক্রেতা বা সাপ্লাই স্বল্পতার কারণে বাতিল</p>
                    </div>
                  </div>
                  <span className="text-rose-700 font-bold font-bangla text-xs">
                    ৳{(cancelledOrders.reduce((acc, o) => acc + (o.totalEstimatedValue || 0), 0) / 100000).toFixed(1)} লাখ
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 2: Sourcing Hubs & Districts */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-serifBangla flex items-center gap-1.5">
              <Anchor className="w-4 h-4 text-blue-600" />
              উপকূল ও হাবভিত্তিক মাছ আহরণ রিপোর্ট
            </h2>
            <span className="text-xs text-slate-400 font-mono">{lots.length} টি লট</span>
          </div>

          {lots.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400 space-y-1.5">
              <Inbox className="w-7 h-7 text-slate-300" />
              <p className="text-xs font-medium">নির্বাচিত সময়সীমায় কোনো ঘাট সরবরাহ লট পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {Array.from(hubMap.entries()).map(([hubName, data]) => {
                const share = totalSourcedKg > 0 ? Math.round((data.kg / totalSourcedKg) * 100) : 0;
                return (
                  <div key={hubName} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        {hubName} হাব ({data.count} টি লট)
                      </span>
                      <span className="text-slate-700 font-mono font-medium text-[11px] sm:text-xs">
                        {data.kg.toLocaleString('bn-BD')} কেজি ({share}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(share, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Operational Activity Stream */}
      <div className="rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-serifBangla">
              সর্বশেষ প্রশাসনিক ও বাণিজ্যিক কার্যক্রম
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{activities.length} টি ইভেন্ট</span>
        </div>

        {activities.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            এই সময়সীমায় কোনো প্রশাসনিক কার্যক্রম রেকর্ড হয়নি।
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {activities.slice(0, 5).map((act) => (
              <div key={act.id} className="p-3 sm:p-3.5 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-semibold text-slate-900 text-xs">{act.action}</h4>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {act.targetType}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] truncate mt-0.5">
                      {act.targetTitle} {act.details ? `• ${act.details}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 text-[11px] text-slate-400">
                  <span className="font-medium text-slate-600 block">{act.actor}</span>
                  <span className="font-mono text-[10px]">{new Date(act.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Corporate Buyers Activity Summary Table */}
      <div className="rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 font-serifBangla flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            শীর্ষ করপোরেট বায়ারদের ক্রয়ের সারাংশ
          </h2>
          <span className="text-xs text-slate-500 font-mono">মোট {orders.length} টি অর্ডার</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1.5">
            <Inbox className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">নির্বাচিত সময়সীমায় কোনো পাইকারি অর্ডার পাওয়া যায়নি</p>
            <p className="text-[11px] text-slate-400">ফিল্টার পরিবর্তন করে 'সর্বমোট' নির্বাচন করতে পারেন</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">অর্ডার নং</th>
                  <th className="py-2.5 px-3 font-semibold">কোম্পানির নাম</th>
                  <th className="py-2.5 px-3 font-semibold">মাছের নাম</th>
                  <th className="py-2.5 px-3 font-semibold">পরিমাণ</th>
                  <th className="py-2.5 px-3 font-semibold">কোটেশন রেট</th>
                  <th className="py-2.5 px-3 font-semibold">মোট মূল্য</th>
                  <th className="py-2.5 px-3 font-semibold">স্ট্যাটাস</th>
                  <th className="py-2.5 px-3 font-semibold">তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-blue-600 font-semibold">{ord.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{ord.companyName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{ord.productName}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                      {ord.quantity} {ord.unit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold font-bangla">
                      {ord.quotedPricePerUnit ? `৳${ord.quotedPricePerUnit}` : 'অনির্ধারিত'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 font-bangla">
                      {ord.totalEstimatedValue ? `৳${ord.totalEstimatedValue.toLocaleString('bn-BD')}` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          ord.orderStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.orderStatus === 'confirmed' || ord.orderStatus === 'processing' || ord.orderStatus === 'dispatched'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : ord.orderStatus === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ord.orderStatus === 'completed'
                          ? 'সম্পন্ন'
                          : ord.orderStatus === 'confirmed'
                          ? 'কনফার্মড'
                          : ord.orderStatus === 'dispatched'
                          ? 'ডেলিভারি চলমান'
                          : ord.orderStatus === 'under_review'
                          ? 'যাচাই চলছে'
                          : ord.orderStatus === 'quoted'
                          ? 'কোটেশন দেওয়া হয়েছে'
                          : ord.orderStatus === 'cancelled'
                          ? 'বাতিল'
                          : 'অপেক্ষমাণ'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('bn-BD') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;

