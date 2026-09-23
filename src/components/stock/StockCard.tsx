import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Stock } from '../../types/stock';
import { formatTaka, toBanglaDigits } from '../../utils/formatters';

interface StockCardProps {
  stock: Stock;
  index?: number;
  tagline?: string;
  className?: string;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  index = 0,
  tagline,
  className = '',
}) => {
  const isLive = stock.status === 'live';

  // Natural Bengali editorial phrases based on category
  const defaultTagline =
    tagline ||
    (stock.category === 'ইলিশ'
      ? 'নদীর স্বাদ\nবাংলার গর্ব'
      : stock.category === 'চিংড়ি'
      ? 'ঘের থেকে\nআপনার ব্যবসায়'
      : stock.category === 'দেশি মাছ'
      ? 'দেশি স্বাদ\nসেরা পুষ্টি'
      : stock.category === 'শুঁটকি'
      ? 'ঐতিহ্যবাহী\nখাঁটি স্বাদ'
      : 'নদীর তাজা\nখাঁটি মাছ');

  const clipId = `organic-clip-${index % 3}`;
  const imageSrc = stock.images && stock.images.length > 0 && stock.images[0] ? stock.images[0] : '/hero-fishermen-boat.png';

  return (
    <div
      className={`group relative bg-white/90 backdrop-blur-xl rounded-[24px] sm:rounded-[30px] border border-white/80 shadow-glass hover:shadow-glass-glow hover:border-cyan-400/40 transition-all duration-300 overflow-hidden flex flex-col lg:flex-row ${className}`}
    >
      {/* Embedded SVG Definition for Precise Organic Shoreline Clipping */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          {/* Desktop Variation 0: Gentle River Flow */}
          <clipPath id="organic-clip-0" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 0.86,0 C 0.98,0.22 0.99,0.50 0.92,0.74 C 0.87,0.90 0.93,0.97 0.82,1.0 L 0,1.0 Z" />
          </clipPath>
          {/* Desktop Variation 1: Natural Coastal Inlet */}
          <clipPath id="organic-clip-1" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 0.84,0 C 0.96,0.18 1.0,0.46 0.94,0.70 C 0.88,0.86 0.94,0.96 0.84,1.0 L 0,1.0 Z" />
          </clipPath>
          {/* Desktop Variation 2: Soft River Stone Incline */}
          <clipPath id="organic-clip-2" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 0.85,0 C 0.98,0.28 0.92,0.62 0.99,0.82 C 0.95,0.96 0.88,1.0 0.80,1.0 L 0,1.0 Z" />
          </clipPath>

          {/* Mobile Bottom Organic Curve */}
          <clipPath id="organic-clip-mobile-0" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 1,0 L 1,0.88 C 0.75,0.99 0.25,0.99 0,0.88 Z" />
          </clipPath>
          <clipPath id="organic-clip-mobile-1" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 1,0 L 1,0.86 C 0.80,1.0 0.20,0.97 0,0.87 Z" />
          </clipPath>
          <clipPath id="organic-clip-mobile-2" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 1,0 L 1,0.87 C 0.70,0.97 0.30,1.0 0,0.86 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* 1. Left Side: Organic Photography with Distinct Natural Shoreline Silhouette */}
      <div className="relative w-full lg:w-[50%] aspect-[16/11] sm:aspect-[16/10] lg:aspect-auto min-h-[250px] sm:min-h-[290px] lg:min-h-[350px] overflow-hidden bg-gangchill-canvas shrink-0">
        <div
          className="w-full h-full relative"
          style={{
            clipPath: `url(#${clipId})`,
          }}
        >
          <img
            src={imageSrc}
            alt={stock.banglaName}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
            loading="lazy"
          />

          {/* Subtle bottom dark gradient strictly for tagline readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Small Handwritten Bangla Phrase on Image */}
          <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6 z-10 text-white pointer-events-none">
            <p className="font-serifBangla italic text-base sm:text-lg font-semibold tracking-wide drop-shadow-md leading-snug text-white/95 whitespace-pre-line">
              {defaultTagline}
            </p>
            <div className="w-8 h-0.5 bg-white/80 mt-1.5 rounded-full" />
          </div>
        </div>

        {/* Desktop Organic Shoreline Divider Overlay (Guarantees visible organic curve) */}
        <svg
          className="absolute top-0 -right-0.5 bottom-0 h-full w-12 lg:w-16 text-white fill-current hidden lg:block pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,0 C65,30 65,70 0,100 L100,100 L100,0 Z" />
        </svg>

        {/* Mobile Organic Bottom Divider Overlay */}
        <svg
          className="absolute -bottom-0.5 left-0 right-0 w-full h-8 text-white fill-current lg:hidden pointer-events-none z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,0 C30,65 70,65 100,0 L100,100 L0,100 Z" />
        </svg>
      </div>

      {/* 2. Right Side: Clean Editorial Product Information */}
      <div className="relative flex-1 p-6 sm:p-7 lg:p-8 flex flex-col justify-between space-y-5 z-10 bg-white/75 backdrop-blur-md">
        {/* Subtle Water / River Pattern in Background Corner */}
        <div
          className="absolute bottom-0 right-0 pointer-events-none select-none opacity-[0.05] overflow-hidden -z-0"
          aria-hidden="true"
        >
          <svg className="w-44 h-32 text-gangchill-blue" viewBox="0 0 200 120" fill="none">
            <path
              d="M0 60 C40 20 80 100 120 60 C160 20 200 100 240 60"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M20 80 C60 40 100 120 140 80 C180 40 220 120 260 80"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Top: Location & Large Product Title */}
        <div className="space-y-2.5">
          {/* Location with Pin */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gangchill-ink-muted">
            <MapPin className="w-3.5 h-3.5 text-gangchill-cyan shrink-0" />
            <span>{stock.location}</span>
          </div>

          {/* Large Title */}
          <h3 className="text-2xl sm:text-[26px] font-bold font-serifBangla text-gangchill-ink leading-[1.2] group-hover:text-gangchill-blue transition-colors">
            {stock.banglaName}
          </h3>

          {/* Short 2-3 line description */}
          <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed line-clamp-3 font-normal pt-1">
            {stock.description}
          </p>
        </div>

        {/* Bottom Section: Quantity, Price & CTA */}
        <div className="space-y-4 pt-4 border-t border-gangchill-ink/8">
          {/* Quantity & Price Grid */}
          <div className="grid grid-cols-2 gap-4 items-baseline">
            <div>
              <span className="text-[11px] sm:text-xs text-gangchill-ink-muted block mb-0.5 font-medium">
                উপলব্ধ পরিমাণ
              </span>
              <div className="text-lg sm:text-xl font-bold font-serifBangla text-gangchill-ink">
                {toBanglaDigits(stock.quantity)} {stock.unit}
              </div>
            </div>

            <div>
              <span className="text-[11px] sm:text-xs text-gangchill-ink-muted block mb-0.5 font-medium">
                {isLive ? 'মূল্য' : 'সম্ভাব্য প্রাপ্তি'}
              </span>
              <div className="text-lg sm:text-xl font-bold font-serifBangla text-gangchill-blue">
                {isLive
                  ? stock.price
                    ? `${formatTaka(stock.price)} / কেজি`
                    : 'দর আলোচনা সাপেক্ষে'
                  : stock.availabilityDate || 'শীঘ্রই'}
              </div>
            </div>
          </div>

          {/* Editorial Lightweight CTA Button with Circle Icon */}
          <div className="pt-1">
            <Link
              to={`/stock/${stock.slug}`}
              className="inline-flex items-center gap-3 text-sm font-bold font-serifBangla text-gangchill-ink group/btn hover:text-gangchill-blue transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs ${
                  index % 2 === 0
                    ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white group-hover/btn:from-blue-800 group-hover/btn:to-blue-700'
                    : 'border border-gangchill-ink/20 text-gangchill-ink group-hover/btn:border-gangchill-blue group-hover/btn:bg-gangchill-blue group-hover/btn:text-white'
                }`}
              >
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
              </div>
              <span className="group-hover/btn:underline">
                {isLive ? 'স্টকটি দেখুন →' : 'বিস্তারিত ও বুকিং →'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
