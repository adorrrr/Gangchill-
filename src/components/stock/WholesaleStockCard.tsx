import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Scale, Calendar, Waves, CheckCircle2 } from 'lucide-react';
import { Stock } from '../../types/stock';
import { formatTaka, toBanglaDigits } from '../../utils/formatters';

interface WholesaleStockCardProps {
  stock: Stock;
  index?: number;
}

export const WholesaleStockCard: React.FC<WholesaleStockCardProps> = ({ stock }) => {
  const isLive = stock.status === 'live';
  const imageSrc = stock.images && stock.images.length > 0 && stock.images[0] ? stock.images[0] : '/hero-fishermen-boat.png';

  return (
    <div className="group relative flex flex-col bg-white/85 backdrop-blur-xl rounded-[24px] sm:rounded-[26px] border border-white/80 shadow-glass hover:shadow-glass-glow hover:border-cyan-400/40 transition-all duration-300 overflow-hidden">
      {/* 1. Photo Header with Overlaid Maritime Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gangchill-surface shrink-0">
        <img
          src={imageSrc}
          alt={stock.banglaName}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Natural gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/25 text-white border border-emerald-300/40 shadow-xs backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
              <span>প্রস্তুত স্টক</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gangchill-navy/90 text-cyan-200 backdrop-blur-md border border-cyan-400/30 shadow-xs">
              <Waves className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>আসন্ন জোয়ের আহরণ</span>
            </span>
          )}

          <span className="px-2.5 py-1 rounded-full text-xs font-bangla font-medium bg-black/40 text-white/90 backdrop-blur-md border border-white/15">
            {stock.category}
          </span>
        </div>

        {/* Bottom Location Tag over Image */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center gap-1.5 text-xs text-white/95 font-medium drop-shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate">{stock.location}</span>
        </div>
      </div>

      {/* 2. Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-serifBangla text-xl font-bold text-gangchill-ink group-hover:text-gangchill-blue transition-colors line-clamp-1 leading-snug">
            {stock.banglaName}
          </h3>

          <p className="line-clamp-2 text-xs text-gangchill-ink-muted leading-relaxed font-normal">
            {stock.description}
          </p>
        </div>

        {/* Specifications Box */}
        <div className="p-3 rounded-natural bg-white/60 border border-gangchill-ink/6 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-gangchill-ink-muted block">উপলব্ধ পরিমাণ</span>
              <span className="font-bold text-gangchill-ink font-serifBangla text-sm">
                {toBanglaDigits(stock.quantity)} {stock.unit}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-gangchill-ink-muted block">ন্যূনতম অর্ডার</span>
              <span className="font-bold text-gangchill-ink font-serifBangla text-sm flex items-center gap-1">
                <Scale className="w-3 h-3 text-gangchill-cyan inline" />
                {stock.minimumOrder ? `${toBanglaDigits(stock.minimumOrder)} কেজি` : 'আলোচনা সাপেক্ষে'}
              </span>
            </div>
          </div>

          {!isLive && stock.availabilityDate && (
            <div className="pt-1.5 border-t border-gangchill-ink/6 flex items-center gap-1.5 text-[11px] text-gangchill-ink-muted font-medium">
              <Calendar className="w-3.5 h-3.5 text-gangchill-cyan shrink-0" />
              <span>ঘাট পৌঁছাবে: <strong className="text-gangchill-ink font-semibold">{stock.availabilityDate}</strong></span>
            </div>
          )}
        </div>

        {/* Footer: Price & Direct Link */}
        <div className="pt-3 border-t border-gangchill-ink/8 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-gangchill-ink-muted block font-medium">
              {isLive ? 'মূল্য' : 'সম্ভাব্য দর'}
            </span>
            <span className="text-base sm:text-lg font-bold font-serifBangla text-gangchill-blue block">
              {stock.price ? `${formatTaka(stock.price)} / কেজি` : 'দর আলোচনা সাপেক্ষে'}
            </span>
          </div>

          <Link
            to={`/stock/${stock.slug}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-natural bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-medium text-xs font-serifBangla shadow-xs transition-all duration-200 group/btn shrink-0"
          >
            <span>{isLive ? 'স্টক দেখুন' : 'অগ্রিম বুকিং'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
