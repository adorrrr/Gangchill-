import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Clock, Users, ShieldCheck, TrendingUp, Calendar } from 'lucide-react';
import { InvestmentOpportunity } from '../../types/investment';
import { ProgressBar } from '../common/ProgressBar';
import { formatTaka, formatDays, toBanglaDigits } from '../../utils/formatters';

interface InvestmentCardProps {
  opportunity: InvestmentOpportunity;
  className?: string;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
  opportunity,
  className = ''
}) => {
  const percentage = Math.min(
    Math.round((opportunity.raisedCapital / opportunity.requiredCapital) * 100),
    100
  );

  const isOpen = opportunity.status === 'open';
  const imageSrc = (opportunity.images && opportunity.images.length > 0 && opportunity.images[0])
    ? opportunity.images[0]
    : ((opportunity as any).image || '/hero-fishermen-boat.png');

  return (
    <div
      className={`group bg-white/85 backdrop-blur-xl rounded-[24px] sm:rounded-[26px] border border-white/80 shadow-glass hover:shadow-glass-glow hover:border-cyan-400/40 transition-all duration-300 overflow-hidden flex flex-col ${className}`}
    >
      {/* 1. Image Header with Overlaid Badges */}
      <div className="relative aspect-[16/10] bg-gangchill-canvas overflow-hidden shrink-0">
        <img
          src={imageSrc}
          alt={opportunity.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/hero-fishermen-boat.png';
          }}
        />

        {/* Gradient for badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
          {isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/25 text-white border border-amber-300/40 shadow-xs backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-100 animate-pulse" />
              <span>তহবিল সংগ্রহ চলছে</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600/25 text-white border border-emerald-300/40 shadow-xs backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
              <span>তহবিল সম্পন্ন</span>
            </span>
          )}

          <span className="px-2.5 py-1 rounded-full text-xs font-bangla font-medium bg-black/40 text-white/95 backdrop-blur-md border border-white/15">
            {opportunity.category}
          </span>
        </div>

        {/* Bottom ROI Pill floating on image */}
        <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-gangchill-blue font-bold text-xs px-3 py-1 rounded-full border border-black/5 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-gangchill-cyan" />
            <span>প্রত্যাশিত মুনাফা {toBanglaDigits(opportunity.profitPercentage)}%</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-white/95 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full">
            <MapPin className="w-3 h-3 text-cyan-300 shrink-0" />
            <span className="truncate max-w-[120px]">{opportunity.location}</span>
          </div>
        </div>
      </div>

      {/* 2. Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold text-lg sm:text-xl font-serifBangla text-gangchill-ink group-hover:text-gangchill-blue transition-colors line-clamp-1 leading-snug">
            {opportunity.title}
          </h3>

          <p className="line-clamp-2 text-xs text-gangchill-ink-muted leading-relaxed font-normal">
            {opportunity.description}
          </p>
        </div>

        {/* 3. Funding Progress */}
        <div className="space-y-2 p-3.5 rounded-natural bg-white/60 border border-gangchill-ink/6">
          <div className="flex justify-between items-baseline text-xs">
            <span className="text-gangchill-ink-muted">
              সংগৃহীত: <strong className="text-gangchill-blue font-semibold">{formatTaka(opportunity.raisedCapital)}</strong>
            </span>
            <span className="text-gangchill-ink-muted">
              লক্ষ্য: <strong className="text-gangchill-ink font-semibold">{formatTaka(opportunity.requiredCapital)}</strong>
            </span>
          </div>

          <ProgressBar current={opportunity.raisedCapital} total={opportunity.requiredCapital} />

          <div className="flex justify-between items-center text-[11px] text-gangchill-ink-muted font-bangla">
            <span className="text-gangchill-blue font-bold">{toBanglaDigits(percentage)}% সম্পন্ন</span>
            {opportunity.investorCount && (
              <span className="flex items-center gap-1 text-gangchill-ink-muted">
                <Users className="w-3 h-3 text-gangchill-cyan shrink-0" />
                <span>{toBanglaDigits(opportunity.investorCount)} জন অংশ নিয়েছেন</span>
              </span>
            )}
          </div>
        </div>

        {/* 4. Financial Specifications Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-white/60 rounded-natural border border-gangchill-ink/6 text-xs">
          <div>
            <span className="text-[11px] text-gangchill-ink-muted block mb-0.5">সর্বনিম্ন বিনিয়োগ</span>
            <span className="font-bold text-gangchill-ink text-sm font-serifBangla">
              {formatTaka(opportunity.minimumInvestment)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-gangchill-ink-muted block mb-0.5">মেয়াদকাল</span>
            <span className="font-bold text-gangchill-ink text-sm font-serifBangla flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gangchill-cyan shrink-0" />
              <span>{formatDays(opportunity.durationDays)}</span>
            </span>
          </div>
          {opportunity.settlementDate && (
            <div className="col-span-2 pt-2 border-t border-gangchill-ink/6 flex items-center justify-between text-[11px]">
              <span className="text-gangchill-ink-muted flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gangchill-cyan shrink-0" />
                <span>সম্ভাব্য নিষ্পত্তি:</span>
              </span>
              <strong className="text-gangchill-ink font-medium">{opportunity.settlementDate}</strong>
            </div>
          )}
        </div>

        {/* 5. Action Button */}
        <Link
          to={`/invest/${opportunity.slug}`}
          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-natural font-serifBangla text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs group/btn ${
            isOpen
              ? 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white'
              : 'bg-white/80 text-gangchill-ink border border-gangchill-ink/15 hover:border-gangchill-blue hover:text-gangchill-blue'
          }`}
        >
          <span>{isOpen ? 'বিনিয়োগে অংশ নিন' : 'প্রকল্পের বিবরণ দেখুন'}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};
