import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Stock } from '../../types/stock';
import { FeaturedStockCard } from './FeaturedStockCard';

interface FeaturedStockCarouselProps {
  stocks: Stock[];
  loading?: boolean;
  className?: string;
}

/**
 * Horizontally scrollable showcase for "আজকের সংগ্রহ" (Featured Today).
 * Cards snap-scroll natively on touch devices; desktop gets optional
 * arrow controls that appear on hover and disable at the scroll edges.
 */
export const FeaturedStockCarousel: React.FC<FeaturedStockCarouselProps> = ({
  stocks,
  loading = false,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, stocks.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className={`flex gap-5 overflow-hidden ${className}`} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[21rem] w-[270px] sm:w-[310px] shrink-0 animate-pulse rounded-[22px] border border-gangchill-ink/8 bg-gangchill-surface"
          />
        ))}
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div
        className={`rounded-[22px] border border-dashed border-gangchill-ink/15 bg-gangchill-surface/60 px-6 py-14 text-center text-sm text-gangchill-ink-muted ${className}`}
      >
        আজকের জন্য নতুন কোনো স্টক তালিকাভুক্ত হয়নি। কিছুক্ষণ পর আবার দেখুন।
      </div>
    );
  }

  return (
    <div className={`group/carousel relative ${className}`}>
      {/* Previous button (desktop) */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="আগের স্টক দেখুন"
        disabled={!canScrollLeft}
        className={`absolute -left-4 top-[7rem] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gangchill-ink/10 bg-white/95 text-gangchill-ink shadow-warm backdrop-blur-sm transition-all duration-300 ease-out hover:border-gangchill-blue hover:text-gangchill-blue disabled:pointer-events-none sm:flex ${
          canScrollLeft ? 'opacity-0 group-hover/carousel:opacity-100' : 'opacity-0'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
      >
        {stocks.map((stock, idx) => (
          <FeaturedStockCard key={stock.id} stock={stock} index={idx} />
        ))}
      </div>

      {/* Next button (desktop) */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="পরবর্তী স্টক দেখুন"
        disabled={!canScrollRight}
        className={`absolute -right-4 top-[7rem] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gangchill-ink/10 bg-white/95 text-gangchill-ink shadow-warm backdrop-blur-sm transition-all duration-300 ease-out hover:border-gangchill-blue hover:text-gangchill-blue disabled:pointer-events-none sm:flex ${
          canScrollRight ? 'opacity-0 group-hover/carousel:opacity-100' : 'opacity-0'
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};