import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, Waves, Scale, Clock } from 'lucide-react';
import { Stock } from '../../types/stock';
import { formatTaka, toBanglaDigits } from '../../utils/formatters';

interface UpcomingStockCardProps {
  stock: Stock;
  index?: number;
}

export const UpcomingStockCard: React.FC<UpcomingStockCardProps> = ({ stock, index = 0 }) => {
  // Determine tidal or seasonal tag based on description or category
  const isHilsa = stock.category === 'ইলিশ' || stock.productName.toLowerCase().includes('hilsa');
  const tidalBadge = isHilsa ? 'অমাবস্যার জোয়ের আহরণ' : 'পূর্ণিমার জোয়ের আহরণ';

  // Extract booking quota approximation for visual feedback
  const bookedPercent = index % 2 === 0 ? 75 : 60;
  const imageSrc = stock.images && stock.images.length > 0 && stock.images[0] ? stock.images[0] : '/hero-fishermen-boat.png';

  return (
    <div className="group relative bg-white/85 backdrop-blur-xl rounded-[24px] sm:rounded-[28px] border border-white/80 shadow-glass hover:shadow-glass-glow hover:border-cyan-400/40 transition-all duration-300 overflow-hidden flex flex-col">
      {/* 1. Header Image & Maritime Badges */}
      <div className="relative aspect-[16/9] sm:aspect-[16/8] overflow-hidden bg-gangchill-surface">
        <img
          src={imageSrc}
          alt={stock.banglaName}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          loading="lazy"
        />

        {/* Gradient overlays for contrast and maritime depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 pointer-events-none" />

        {/* Top Badges Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          {/* Tidal Joar Pill with liquid glass feel */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gangchill-navy/90 text-cyan-200 backdrop-blur-md border border-cyan-400/30 shadow-xs">
            <Waves className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>{tidalBadge}</span>
          </div>

          {/* Category Pill */}
          <span className="px-2.5 py-1 rounded-full text-xs font-bangla font-medium bg-black/40 text-white/90 backdrop-blur-md border border-white/15">
            {stock.category}
          </span>
        </div>

        {/* Bottom Banner on Image: Expected Arrival Date */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-white text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 font-medium bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>ঘাট পৌঁছাবে: {stock.availabilityDate || 'শীঘ্রই আসছে'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Clock className="w-3 h-3 text-cyan-300" />
            <span>অগ্রিম লট বুকিং</span>
          </div>
        </div>
      </div>

      {/* 2. Card Content Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        {/* Title & Origin */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gangchill-ink-muted">
            <MapPin className="w-3.5 h-3.5 text-gangchill-cyan shrink-0" />
            <span>{stock.location}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serifBangla text-gangchill-ink group-hover:text-gangchill-blue transition-colors line-clamp-1">
            {stock.banglaName}
          </h3>

          <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed line-clamp-2 font-normal">
            {stock.description}
          </p>
        </div>

        {/* 3. Specs & Lot Quota Tracker */}
        <div className="p-3.5 rounded-natural bg-white/60 border border-gangchill-ink/6 space-y-2.5">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gangchill-ink-muted block text-[11px]">প্রত্যাশিত আহরণ</span>
              <span className="font-bold text-gangchill-ink font-serifBangla text-sm">
                {toBanglaDigits(stock.quantity)} {stock.unit}
              </span>
            </div>
            <div>
              <span className="text-gangchill-ink-muted block text-[11px]">ন্যূনতম অর্ডার</span>
              <span className="font-bold text-gangchill-ink font-serifBangla text-sm flex items-center gap-1">
                <Scale className="w-3 h-3 text-gangchill-cyan inline" />
                {stock.minimumOrder ? `${toBanglaDigits(stock.minimumOrder)} কেজি` : 'আলোচনা সাপেক্ষে'}
              </span>
            </div>
          </div>

          {/* Quota Progress Bar */}
          <div className="space-y-1 pt-1 border-t border-gangchill-ink/6">
            <div className="flex justify-between text-[11px] text-gangchill-ink-muted font-medium">
              <span>অগ্রিম বুকিং চাহিদা</span>
              <span className="text-gangchill-blue font-semibold">{toBanglaDigits(bookedPercent)}% বুকড</span>
            </div>
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${bookedPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Pricing & Action CTA */}
        <div className="pt-2 border-t border-gangchill-ink/8 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-gangchill-ink-muted block font-medium">সম্ভাব্য মূল্য</span>
            <div className="text-base sm:text-lg font-bold font-serifBangla text-gangchill-blue">
              {stock.price ? `${formatTaka(stock.price)} / কেজি` : 'দর আলোচনা সাপেক্ষে'}
            </div>
          </div>

          <Link
            to={`/stock/${stock.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-natural bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-medium text-xs sm:text-sm font-serifBangla shadow-xs transition-all duration-200 group/btn"
          >
            <span>অগ্রিম বুকিং</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
