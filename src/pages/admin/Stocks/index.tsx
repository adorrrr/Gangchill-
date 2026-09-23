import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Fish,
  Eye,
  MapPin,
  Filter
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { Stock, StockStatus } from '../../../types/stock';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { toBanglaDigits } from '../../../utils/formatters';

export const AdminStocksPage: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সব');
  const [selectedStatus, setSelectedStatus] = useState<'all' | StockStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<Stock | null>(null);

  const loadStocks = async () => {
    try {
      const serverStocks = await adminService.fetchStocks();
      setStocks(serverStocks);
    } catch (err) {
      setStocks(adminService.getStocks());
    }
  };

  useEffect(() => {
    loadStocks();
    const handleUpdate = () => {
      loadStocks();
    };
    window.addEventListener('gangchill_stocks_updated', handleUpdate);
    return () => window.removeEventListener('gangchill_stocks_updated', handleUpdate);
  }, []);

  const categories = ['সব', ...Array.from(new Set(stocks.map((s) => s.category)))];

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      stock.banglaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'সব' || stock.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || stock.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: StockStatus) => {
    try {
      await adminService.toggleStockStatus(id, newStatus);
      await loadStocks();
    } catch (err) {
      console.error('Failed to change status:', err);
      loadStocks();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteStock(deleteTarget.id);
      setDeleteTarget(null);
      await loadStocks();
    } catch (err) {
      console.error('Failed to delete stock:', err);
      setDeleteTarget(null);
      loadStocks();
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="মাছের নাম, ঘাট বা জেলা দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>ক্যাটাগরি:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
          >
            <option value="all">সব স্ট্যাটাস</option>
            <option value="live">লাইভ স্টক (Live)</option>
            <option value="upcoming">আসন্ন (Upcoming)</option>
            <option value="sold">স্টক সমাপ্ত (Sold)</option>
          </select>

          <Link
            to="/admin/stocks/new"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন স্টক</span>
          </Link>
        </div>
      </div>

      {/* 3. Clean Data Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">মাছের নাম ও ছবি</th>
                <th className="py-2.5 px-3.5 font-semibold">ক্যাটাগরি</th>
                <th className="py-2.5 px-3.5 font-semibold">ঘাট ও জেলা</th>
                <th className="py-2.5 px-3.5 font-semibold">মজুত পরিমাণ</th>
                <th className="py-2.5 px-3.5 font-semibold">পাইকারি মূল্য</th>
                <th className="py-2.5 px-3.5 font-semibold">স্ট্যাটাস</th>
                <th className="py-2.5 px-3.5 font-semibold text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStocks.map((stock) => (
                <tr key={stock.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Fish Name & Image */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img
                          src={stock.images && stock.images.length > 0 ? stock.images[0] : '/hero-fishermen-boat.png'}
                          alt={stock.banglaName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors truncate">
                          {stock.banglaName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {stock.productName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px]">
                      {stock.category}
                    </span>
                  </td>

                  {/* Location & District */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{stock.location || stock.district}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block ml-5 font-mono">{stock.district}</span>
                  </td>

                  {/* Available Stock */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 font-mono">
                      {toBanglaDigits(stock.quantity)} {stock.unit}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      ন্যূনতম: {toBanglaDigits(stock.minimumOrder || 50)} কেজি
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-blue-600 font-mono text-sm">
                      ৳{toBanglaDigits(stock.price || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">প্রতি কেজি</span>
                  </td>

                  {/* Status & Quick Switcher */}
                  <td className="py-3.5 px-4">
                    <select
                      value={stock.status}
                      onChange={(e) => handleStatusChange(stock.id, e.target.value as StockStatus)}
                      className="text-[11px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="live">লাইভ (Live)</option>
                      <option value="upcoming">আসন্ন (Upcoming)</option>
                      <option value="sold">স্টক শেষ (Sold)</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/stock/${stock.slug}`}
                        target="_blank"
                        title="পাবলিক ওয়েবসাইট প্রিভিউ"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/admin/stocks/${stock.id}/edit`}
                        title="সম্পাদনা করুন"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(stock)}
                        title="মুছে ফেলুন"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Fish className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    কোনো মাছের স্টক তথ্য খুঁজে পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="মাছের স্টক মুছে ফেলবেন?"
        message={`আপনি কি নিশ্চিতভাবে "${deleteTarget?.banglaName}" স্টকটি প্ল্যাটফর্ম থেকে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
