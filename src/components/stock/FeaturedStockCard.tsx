import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Tag } from 'lucide-react';
import { Stock } from '../../types/stock';
import { Badge } from '../common/Badge';
import { formatTaka } from '../../utils/formatters';

interface FeaturedStockCardProps {
  stock: Stock;
  index?: number;
  className?: string;
}

export const FeaturedStockCard: React.FC<FeaturedStockCardProps> = ({
  stock,
  className = '',
}) => {
  const isLive = stock.status === 'live';
  const imageSrc = stock.images && stock.images.length > 0 && stock.images[0] ? stock.images[0] : '/hero-fishermen-boat.png';

  return (
    <Link
      to={`/stock/${stock.slug}`}
      className={`group relative flex w-[270px] sm:w-[310px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white/80 backdrop-blur-xl shadow-glass transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-cyan-400/40 hover:shadow-glass-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gangchill-blue focus-visible:ring-offset-2 ${className}`}
    >
      {/* Image */}
      <div className="relative h-44 sm:h-48 w-full shrink-0 overflow-hidden bg-gangchill-canvas">
        <img
          src={imageSrc}
          alt={stock.banglaName}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent" />
        <div className="absolute left-3 top-3">
          <Badge status={stock.status} size="sm" className="shadow-xs backdrop-blur-md" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gangchill-ink-muted">
            <Tag className="h-3.5 w-3.5 shrink-0 text-gangchill-cyan" aria-hidden="true" />
            <span>{stock.category}</span>
            <span className="text-gangchill-ink/20" aria-hidden="true">
              •
            </span>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gangchill-ink-muted" aria-hidden="true" />
            <span className="truncate">{stock.district}</span>
          </div>

          <h3 className="font-serifBangla text-lg font-bold leading-snug text-gangchill-ink transition-colors group-hover:text-gangchill-blue">
            {stock.banglaName}
          </h3>

          <p className="line-clamp-2 text-xs leading-relaxed text-gangchill-ink-muted">
            {stock.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gangchill-ink/8 pt-3.5">
          <div className="min-w-0">
            <span className="block text-[11px] text-gangchill-ink-muted">
              {isLive ? 'মূল্য' : 'সম্ভাব্য প্রাপ্তি'}
            </span>
            <span className="block truncate text-sm font-bold font-serifBangla text-gangchill-blue">
              {isLive
                ? stock.price
                  ? `${formatTaka(stock.price)} / কেজি`
                  : 'দর আলোচনা সাপেক্ষে'
                : stock.availabilityDate || 'শীঘ্রই'}
            </span>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gangchill-ink/15 text-gangchill-ink transition-all duration-300 ease-out group-hover:-rotate-45 group-hover:border-gangchill-blue group-hover:bg-gangchill-blue group-hover:text-white shadow-xs">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>
    </Link>
  );
};