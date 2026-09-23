import React from 'react';
import { OrderStatus } from '../../types/admin';
import { StockStatus } from '../../types/stock';

interface AdminStatusBadgeProps {
  status: OrderStatus | StockStatus | 'verified' | 'approved' | 'rejected' | 'draft' | string;
  type?: 'order' | 'stock' | 'seller';
  className?: string;
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    // Order Statuses
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>অপেক্ষমাণ (Pending)</span>
        </span>
      );
    case 'under_review':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>যাচাই চলছে (Reviewing)</span>
        </span>
      );
    case 'quoted':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>দরপত্র প্রেরিত (Quoted)</span>
        </span>
      );
    case 'confirmed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>নিশ্চিত ক্রয়াদেশ (Confirmed)</span>
        </span>
      );
    case 'processing':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span>প্রসেসিং (Processing)</span>
        </span>
      );
    case 'dispatched':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-cyan-50 text-cyan-800 border border-cyan-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          <span>পরিবহনরত (Dispatched)</span>
        </span>
      );
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>সরবরাহ সম্পন্ন (Completed)</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>বাতিল (Cancelled)</span>
        </span>
      );

    // Stock Statuses
    case 'live':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>লাইভ স্টক (Live)</span>
        </span>
      );
    case 'upcoming':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>আসন্ন আহরণ (Upcoming)</span>
        </span>
      );
    case 'sold':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>স্টক সমাপ্ত (Sold)</span>
        </span>
      );
    case 'draft':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>খসড়া (Draft)</span>
        </span>
      );

    // Seller Lot Verification Statuses
    case 'verified':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span>যাচাইকৃত (Verified)</span>
        </span>
      );
    case 'approved':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>স্টকে রূপান্তরিত (Approved)</span>
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>প্রত্যাখ্যাত (Rejected)</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          <span>{status}</span>
        </span>
      );
  }
};
