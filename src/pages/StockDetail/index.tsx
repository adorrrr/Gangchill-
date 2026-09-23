import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { BackButton } from '../../components/common/BackButton';
import { CorporateRequirementModal } from '../../components/forms/CorporateRequirementModal';
import { stockService } from '../../services/stockService';
import { adminService } from '../../services/adminService';
import { Stock } from '../../types/stock';
import { formatTaka, toBanglaDigits } from '../../utils/formatters';
import { Seo, SEO_SITE_URL } from '../../components/seo/Seo';
import { AlertTriangle, Phone, Lock } from 'lucide-react';

export const StockDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState(() => adminService.getSettings());

  useEffect(() => {
    adminService.fetchSettings().then((fresh) => {
      if (fresh) setPlatformSettings(fresh);
    }).catch(console.error);

    const syncSettings = () => {
      setPlatformSettings(adminService.getSettings());
    };
    window.addEventListener('gangchill_settings_updated', syncSettings);
    window.addEventListener('storage', syncSettings);
    return () => {
      window.removeEventListener('gangchill_settings_updated', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);

  const isMaintenanceMode = Boolean(platformSettings?.maintenanceMode);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      stockService.getStockBySlug(slug).then((res) => {
        setStock(res);
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <Seo
          title="মাছের স্টক লোড হচ্ছে... | Gangchill (গাংচিল)"
          description="গাংচিল পাইকারি মাছের বিবরণ লোড হচ্ছে।"
          path={`/stock/${slug || ''}`}
          noindex
        />
        <Container className="py-20 text-center font-mono text-sm text-gangchill-ink/50">
          মাছের স্টকের বিবরণ লোড হচ্ছে...
        </Container>
      </>
    );
  }

  if (!stock) {
    return (
      <>
        <Seo
          title="পণ্যটি খুঁজে পাওয়া যায়নি | Gangchill (গাংচিল)"
          description="আপনি যে মাছের স্টকটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা খুঁজে পাওয়া যায়নি।"
          path={`/stock/${slug || ''}`}
          noindex
        />
        <Container className="py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold font-serifBangla text-gangchill-ink">
            পণ্যটি খুঁজে পাওয়া যায়নি
          </h2>
          <Link to="/buy" className="text-sm font-semibold text-gangchill-blue hover:text-gangchill-navy underline">
            স্টক বোর্ডে ফিরে যান
          </Link>
        </Container>
      </>
    );
  }

  const isLive = stock.status === 'live';

  const stockStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${stock.banglaName} (${stock.productName})`,
      image: stock.images[0],
      description: stock.description,
      category: stock.category,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BDT',
        price: stock.price || '0',
        availability: stock.status === 'live' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: SEO_SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'পাইকারি মাছ', item: `${SEO_SITE_URL}/buy` },
        { '@type': 'ListItem', position: 3, name: stock.banglaName, item: `${SEO_SITE_URL}/stock/${stock.slug}` },
      ],
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen py-8 sm:py-16">
      <Seo
        title={`${stock.banglaName} (${stock.productName}) — পাইকারি মূল্য ও বিবরণ | Gangchill (গাংচিল)`}
        description={`${stock.banglaName} — ${stock.location} (${stock.district}) থেকে সরাসরি সংগৃহীত। পরিমাণ: ${toBanglaDigits(stock.quantity)} ${stock.unit}। সরাসরি পাইকারি কোটেশন সংগ্রহ করুন।`}
        path={`/stock/${stock.slug}`}
        image={stock.images[0]}
        keywords={[stock.banglaName, stock.productName, stock.category, stock.district, 'পাইকারি মাছ', 'Gangchill']}
        structuredData={stockStructuredData}
      />
      <Container size="md">
        {/* Back Link */}
        <div className="mb-6">
          <BackButton to="/buy" label="বর্তমান স্টকে ফিরুন" />
        </div>

        {/* 1. Large Un-boxed Photography */}
        <div className="w-full aspect-16/10 sm:aspect-21/10 overflow-hidden bg-gangchill-surface border border-gangchill-ink/10 mb-8 sm:mb-12">
          <img
            src={stock.images[0]}
            alt={stock.banglaName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 2. Editorial Story & Title */}
        <div className="space-y-6 max-w-3xl">
          <div className="text-xs font-bangla font-semibold text-gangchill-blue tracking-wide">
            {isLive ? '✓ বর্তমানে সংগ্রহযোগ্য' : '⏳ আসন্ন আহরণ'} · {stock.category}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-gangchill-ink leading-tight">
            {stock.banglaName}
          </h1>

          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serifBangla text-gangchill-ink">
            {toBanglaDigits(stock.quantity)} <span className="text-lg sm:text-xl font-normal text-gangchill-ink/70">{stock.unit}</span>
          </div>

          <p className="text-sm sm:text-lg text-gangchill-ink/80 leading-relaxed font-light border-l-2 border-gangchill-blue pl-3 sm:pl-4">
            {stock.description}
          </p>

          {/* 3. Human Arranged Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-5 sm:pt-6 border-t border-b border-gangchill-ink/12 py-6 sm:py-8 my-6 sm:my-8 text-sm">
            <div>
              <span className="text-xs text-gangchill-ink/50 block mb-1">উৎস ঘাট / মোহনা / ঘের</span>
              <strong className="text-base text-gangchill-ink">{stock.location} ({stock.district})</strong>
              {stock.originDetails?.unionOrVillage && (
                <div className="text-xs text-gangchill-ink/70 mt-0.5">{stock.originDetails.unionOrVillage}</div>
              )}
            </div>

            <div>
              <span className="text-xs text-gangchill-ink/50 block mb-1">আহরণের সময় / পাওয়ার তারিখ</span>
              <strong className="text-base text-gangchill-ink">{stock.harvestDate || stock.availabilityDate || 'আজকের তাজা সংগ্রহ'}</strong>
            </div>

            <div>
              <span className="text-xs text-gangchill-ink/50 block mb-1">Size ও কোয়ালিটি গ্রেড</span>
              <strong className="text-base text-gangchill-ink">{stock.grade || 'স্ট্যান্ডার্ড এক্সপোর্ট গ্রেড'}</strong>
            </div>

            <div>
              <span className="text-xs text-gangchill-ink/50 block mb-1">সংরক্ষণ ও প্যাকেজিং</span>
              <strong className="text-base text-gangchill-ink">{stock.packaging || 'ইনসুলেটেড আইস বক্স'}</strong>
            </div>

            <div>
              <span className="text-xs text-gangchill-ink/50 block mb-1">ন্যূনতম ক্রয়সীমা</span>
              <strong className="text-base text-gangchill-ink">{stock.minimumOrder ? `${toBanglaDigits(stock.minimumOrder)} কেজি/টন` : 'আলোচনা সাপেক্ষে'}</strong>
            </div>

            <div>
              <span className="text-xs text-gangchill-ink/50 block mb-1">দর ও পেমেন্ট স্ট্যাটাস</span>
              <strong className="text-base text-gangchill-blue">
                {stock.price ? `${formatTaka(stock.price)} / কেজি` : 'আলোচনা সাপেক্ষে'}
              </strong>
            </div>

            {stock.logistics?.estimatedDeliveryDays && (
              <div className="sm:col-span-2">
                <span className="text-xs text-gangchill-ink/50 block mb-1">ডেলিভারি উইন্ডো ও কোল্ডচেইন লজিস্টিক্স</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  <strong className="text-base text-gangchill-ink">{stock.logistics.estimatedDeliveryDays}</strong>
                  {platformSettings?.coldChainEnabled && stock.logistics.transportAssistance && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      <span>❄️</span>
                      <span>কোল্ড চেইন তাপমাত্রা মনিটরিং সক্রিয় (-১৮°C রেফার ভ্যান)</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Action */}
          <div className="pt-4">
            <button
              type="button"
              disabled={isMaintenanceMode}
              onClick={() => {
                if (!isMaintenanceMode) setIsRequirementModalOpen(true);
              }}
              className={`w-full sm:w-auto px-5 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all inline-flex items-center justify-center gap-3 shadow-sm ${
                isMaintenanceMode
                  ? 'bg-rose-600 hover:bg-rose-600 text-white cursor-not-allowed opacity-90'
                  : 'bg-gangchill-blue text-white hover:bg-gangchill-navy active:scale-95 cursor-pointer'
              }`}
            >
              {isMaintenanceMode ? (
                <>
                  <Lock className="w-5 h-5 text-white" />
                  <span>🔒 কিনুন — বর্তমানে বন্ধ</span>
                </>
              ) : (
                <>
                  <span>এই স্টকটি প্রয়োজন</span>
                  <span>→</span>
                </>
              )}
            </button>
            {isMaintenanceMode ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 mt-3 text-xs sm:text-sm space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-900 font-bold font-serifBangla">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚠️ রক্ষণাবেক্ষণ বিজ্ঞপ্তি</span>
                </div>
                <p className="text-rose-900/90 leading-relaxed text-xs">
                  {platformSettings?.maintenanceMessage || 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।'}{' '}
                  জরুরি প্রয়োজনে কল করুন:{' '}
                  <a
                    href={`tel:${platformSettings?.emergencyHotline || platformSettings?.supportPhone || '+8801711234567'}`}
                    className="underline font-bold font-mono inline-flex items-center gap-1 text-slate-950 hover:text-black"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{platformSettings?.emergencyHotline || platformSettings?.supportPhone || '+880 1711-234567'}</span>
                  </a>
                </p>
              </div>
            ) : (
              <p className="text-xs text-gangchill-ink/60 mt-2">
                আপনার চাহিদা জমা দিলে Gangchill সোর্সিং টিম সরাসরি ঘাট ও আড়তের কোটেশন নিয়ে যোগাযোগ করবে।
              </p>
            )}
          </div>
        </div>
      </Container>

      <CorporateRequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        prefilledStock={stock}
      />
    </div>
  );
};
