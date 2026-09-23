import React, { useState, useEffect } from 'react';
import {
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Fish,
  Calendar,
  AlertTriangle,
  Archive
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { SellerLot } from '../../../types/admin';
import { AdminStatusBadge } from '../../../components/admin/AdminStatusBadge';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { toBanglaDigits, formatBanglaDate } from '../../../utils/formatters';

export const AdminSubmissionsPage: React.FC = () => {
  const [lots, setLots] = useState<SellerLot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [convertTarget, setConvertTarget] = useState<SellerLot | null>(null);

  const loadLots = async () => {
    try {
      const freshLots = await adminService.fetchSellerLots();
      setLots(freshLots);
    } catch {
      setLots(adminService.getSellerLots());
    }
  };

  useEffect(() => {
    loadLots();

    const handleUpdate = () => {
      loadLots();
    };

    window.addEventListener('gangchill_seller_lots_updated', handleUpdate);
    return () => {
      window.removeEventListener('gangchill_seller_lots_updated', handleUpdate);
    };
  }, []);

  const handleUpdateStatus = async (lotId: string, status: 'pending' | 'verified' | 'approved' | 'rejected') => {
    await adminService.updateSellerLotStatus(lotId, status);
    loadLots();
  };

  const handleConvertConfirm = async () => {
    if (!convertTarget) return;
    await adminService.convertLotToStock(convertTarget.id);
    setConvertTarget(null);
    loadLots();
  };

  const isLotDeleted = (lot: SellerLot) => Boolean(lot.isStockDeleted || lot.stockDeletedAt);

  // Counts for each tab
  const activeLots = lots.filter((l) => !isLotDeleted(l));
  const deletedLots = lots.filter((l) => isLotDeleted(l));

  const counts: Record<string, number> = {
    all: activeLots.length,
    pending: activeLots.filter((l) => l.verificationStatus === 'pending').length,
    verified: activeLots.filter((l) => l.verificationStatus === 'verified').length,
    approved: activeLots.filter((l) => l.verificationStatus === 'approved').length,
    rejected: activeLots.filter((l) => l.verificationStatus === 'rejected').length,
    deleted: deletedLots.length
  };

  const filteredLots = lots.filter((lot) => {
    const isDeleted = isLotDeleted(lot);

    if (selectedStatus === 'deleted') {
      if (!isDeleted) return false;
    } else {
      if (isDeleted) return false;
      if (selectedStatus !== 'all' && lot.verificationStatus !== selectedStatus) {
        return false;
      }
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    return (
      lot.farmerName.toLowerCase().includes(q) ||
      lot.productName.toLowerCase().includes(q) ||
      lot.district.toLowerCase().includes(q) ||
      lot.location.toLowerCase().includes(q) ||
      lot.phone.includes(q) ||
      lot.id.toLowerCase().includes(q)
    );
  });

  const formatCollectionDate = (dateStr?: string) => {
    if (!dateStr) return 'আজকের তাজা আহরণ থেকে';
    const formatted = formatBanglaDate(dateStr);
    return formatted.includes('থেকে') ? formatted : `${formatted} থেকে`;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-2.5 sm:space-y-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="জেলে/চাষির নাম, ফোন নম্বর, মাছের প্রজাতি বা ঘাট দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1 border-t border-slate-100">
          {[
            { label: 'সকল প্রস্তাব', value: 'all' },
            { label: 'অপেক্ষমাণ', value: 'pending' },
            { label: 'যাচাইকৃত', value: 'verified' },
            { label: 'অনুমোদিত', value: 'approved' },
            { label: 'প্রত্যাখ্যাত', value: 'rejected' },
            { label: '🗑️ ডিলিট করা লট', value: 'deleted' }
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1 ${
                selectedStatus === tab.value
                  ? tab.value === 'deleted'
                    ? 'bg-rose-600 text-white font-semibold border-rose-600 shadow-xs'
                    : 'bg-blue-600 text-white font-semibold border-blue-600 shadow-xs'
                  : tab.value === 'deleted'
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                selectedStatus === tab.value
                  ? 'bg-white/25 text-white font-bold'
                  : tab.value === 'deleted'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200/80 text-slate-700'
              }`}>
                {toBanglaDigits(counts[tab.value] ?? 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Supplier Lots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {filteredLots.length === 0 ? (
          <div className="col-span-1 md:col-span-2 py-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200/80">
            {selectedStatus === 'deleted'
              ? 'ডিলিট করা কোনো লটের রেকর্ড নেই।'
              : 'কোনো ঘাট সরবরাহ লট পাওয়া যায়নি।'}
          </div>
        ) : (
          filteredLots.map((lot) => {
            const isDel = isLotDeleted(lot);
            return (
              <div
                key={lot.id}
                className={`bg-white rounded-xl p-3.5 sm:p-4 border transition-all shadow-xs space-y-3 flex flex-col justify-between ${
                  isDel
                    ? 'border-rose-200/90 bg-gradient-to-b from-rose-50/30 to-white'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-semibold text-slate-400">{lot.id}</span>
                        <AdminStatusBadge status={lot.verificationStatus} />
                      </div>
                      <h3 className="font-bold font-serifBangla text-base sm:text-lg text-slate-900 mt-1">
                        {lot.productName}
                      </h3>
                    </div>

                    {/* Current availability status */}
                    <div className="shrink-0 text-right">
                      {lot.stockType === 'current' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                          ✓ এখন বিক্রির জন্য প্রস্তুত
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                          ⏳ সামনে প্রস্তুত হবে
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Farmer Info */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] sm:text-[11px]">সরবরাহকারী:</span>
                      <strong className="text-slate-900 font-bold text-xs sm:text-sm">{lot.farmerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] sm:text-[11px]">মোবাইল নম্বর:</span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <a
                          href={`tel:${lot.phone}`}
                          className="text-blue-700 hover:text-blue-800 hover:underline font-mono font-bold flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs"
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{lot.phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/88${lot.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-semibold transition-colors"
                          title="WhatsApp চ্যাট"
                        >
                          WA
                        </a>
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-1 text-slate-600 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-medium">{lot.location} ({lot.district})</span>
                    </div>
                  </div>

                  {/* Collection Date Indicator */}
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-slate-700">
                      সংগ্রহ করা যাবে:{' '}
                      <strong className="text-slate-900 font-bold font-serifBangla">
                        {formatCollectionDate(lot.availabilityDate)}
                      </strong>
                    </span>
                  </div>

                  {/* Lot Stats */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] sm:text-[11px] block">পরিমাণ:</span>
                      <strong className="text-xs sm:text-sm font-serifBangla text-slate-900 font-bold">
                        {toBanglaDigits(lot.quantity)} {lot.unit}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] sm:text-[11px] block">আশানুরূপ দাম:</span>
                      <strong className="text-xs sm:text-sm font-serifBangla text-blue-700 font-bold">
                        {lot.expectedPrice ? `৳${lot.expectedPrice} /কেজি` : 'আলোচনা সাপেক্ষে'}
                      </strong>
                    </div>
                  </div>

                  {lot.description && (
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      "{lot.description}"
                    </p>
                  )}

                  {/* Photos */}
                  {lot.images && lot.images.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600">ঘাট থেকে পাঠানো ছবি:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {lot.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt="Fish lot"
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deleted Stock Notice & Information */}
                  {isDel && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>স্টক পোস্টটি অপসারিত (ডিলিট করা লট)</span>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-normal">
                        এই লট থেকে পূর্বে স্টক তৈরি করা হয়েছিল। পরবর্তীতে কিনুন/স্টক তালিকা থেকে স্টকটি মুছে ফেলা হয়েছে। লটের মূল তথ্য সংরক্ষিত রয়েছে:
                      </p>
                      <div className="pt-1.5 border-t border-rose-200/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-rose-950">
                        <div>
                          মূল স্টক: <strong className="font-semibold">{lot.stockDeletedName || lot.productName}</strong>
                        </div>
                        {lot.convertedStockId && (
                          <div>
                            স্টক আইডি: <span className="font-mono text-[10px]">{lot.convertedStockId}</span>
                          </div>
                        )}
                        {lot.stockDeletedAt && (
                          <div className="sm:col-span-2">
                            মুছে ফেলার সময়: <span className="font-mono">{new Date(lot.stockDeletedAt).toLocaleString('bn-BD')}</span>
                          </div>
                        )}
                        {lot.inspectionNotes && (
                          <div className="sm:col-span-2 text-slate-600 italic">
                            নোট: {lot.inspectionNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons or Archive Notice */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {isDel ? (
                    <div className="w-full flex items-center justify-between gap-2 text-xs text-slate-500 font-medium bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>সংরক্ষিত আর্কাইভ রেকর্ড (অপরিবর্তনীয়)</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        পূর্বের অবস্থা: {lot.verificationStatus === 'approved' ? 'অনুমোদিত' : lot.verificationStatus}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        {lot.verificationStatus !== 'verified' && lot.verificationStatus !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(lot.id, 'verified')}
                            className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer"
                          >
                            মাঠ যাচাই সম্পন্ন
                          </button>
                        )}

                        {lot.verificationStatus !== 'rejected' && lot.verificationStatus !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(lot.id, 'rejected')}
                            className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer"
                          >
                            প্রত্যাখ্যান
                          </button>
                        )}
                      </div>

                      {lot.verificationStatus !== 'approved' ? (
                        <button
                          type="button"
                          onClick={() => setConvertTarget(lot)}
                          className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Fish className="w-3.5 h-3.5" />
                          <span>স্টকে রূপান্তর করুন →</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>লাইভ স্টকে যুক্ত হয়েছে</span>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal to Convert Lot into Live Stock */}
      <ConfirmModal
        isOpen={Boolean(convertTarget)}
        title="সরবরাহ লটকে ইনভেন্টরি স্টকে রূপান্তর"
        message={`আপনি কি "${convertTarget?.farmerName}"-এর "${convertTarget?.productName}" (${convertTarget?.quantity} ${convertTarget?.unit}) লটটি অনুমোদন করে ওয়েবসাইটে সরাসরি লাইভ স্টক পোস্টে প্রকাশ করতে চান?`}
        confirmLabel="হ্যাঁ, স্টকে রূপান্তর করুন"
        variant="success"
        onConfirm={handleConvertConfirm}
        onClose={() => setConvertTarget(null)}
      />
    </div>
  );
};

export default AdminSubmissionsPage;
