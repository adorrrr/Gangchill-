import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { CorporateRequirementModal } from '../../components/forms/CorporateRequirementModal';
import { stockService } from '../../services/stockService';
import { adminService } from '../../services/adminService';
import { WholesaleStockCard } from '../../components/stock/WholesaleStockCard';
import { Stock, StockStatus } from '../../types/stock';
import { toBanglaDigits } from '../../utils/formatters';
import { Seo, SEO_SITE_URL } from '../../components/seo/Seo';
import { ClipboardList, Sparkles, AlertTriangle, Phone, Lock } from 'lucide-react';

export const BuyPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: StockStatus = rawTab === 'upcoming' ? 'upcoming' : 'live';

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [upcomingCount, setUpcomingCount] = useState<number>(0);
  const [platformSettings, setPlatformSettings] = useState(() => adminService.getSettings());

  useEffect(() => {
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
    if (searchParams.get('action') === 'demand') {
      setIsRequirementModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadStocksData = () => {
    setLoading(true);
    stockService.getStocks().then((all) => {
      setLiveCount(all.filter((s) => s.status === 'live').length);
      setUpcomingCount(all.filter((s) => s.status === 'upcoming').length);
      const filtered = all.filter((s) => s.status === activeTab);
      setStocks(filtered);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadStocksData();

    const handleStockUpdate = () => {
      loadStocksData();
    };

    window.addEventListener('gangchill_stocks_updated', handleStockUpdate);
    window.addEventListener('focus', handleStockUpdate);
    return () => {
      window.removeEventListener('gangchill_stocks_updated', handleStockUpdate);
      window.removeEventListener('focus', handleStockUpdate);
    };
  }, [activeTab]);

  const handleTabChange = (tab: StockStatus) => {
    if (tab === 'live') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  const buyStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'পাইকারি মাছের লাইভ স্টক বোর্ড',
      url: `${SEO_SITE_URL}/buy`,
      description: 'উপকূলীয় ঘাট ও নদী থেকে সরাসরি সংগৃহীত তাজা মাছের পাইকারি লাইভ লট।',
      inLanguage: 'bn-BD',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: SEO_SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'পাইকারি মাছ কিনুন', item: `${SEO_SITE_URL}/buy` },
      ],
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen py-10 sm:py-16">
      <Seo
        title="পাইকারি মাছ কিনুন | Gangchill (গাংচিল)"
        description="উপকূলীয় ঘাট ও নদী থেকে সরাসরি সংগৃহীত তাজা মাছের পাইকারি লাইভ লট। ইলিশ, রুই, কাতলা, পাবদা ও সামুদ্রিক মাছের দৈনিক পাইকারি রেট ও স্টক দেখুন।"
        path="/buy"
        keywords={['মাছ কিনুন', 'পাইকারি মাছের রেট', 'আজকের স্টক', 'ইলিশ', 'রুই', 'কাতলা', 'পাবদা', 'Gangchill']}
        structuredData={buyStructuredData}
      />
      <Container>
        {/* Wholesale Fish Stock Board Masthead */}
        <div className="border-b border-gangchill-ink/12 pb-6 mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bangla font-semibold text-gangchill-blue bg-gangchill-blue/10 px-3 py-1 rounded-full border border-gangchill-blue/20 tracking-wide mb-2">
            <span className="w-2 h-2 rounded-full bg-gangchill-blue animate-pulse" />
            <span>Gangchill হোলসেল ফিশ স্টক বোর্ড</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-gangchill-ink tracking-tight mb-2">
                আজ কী পাওয়া যাচ্ছে?
              </h1>
              <p className="text-sm sm:text-base text-gangchill-ink/75 max-w-2xl font-light">
                সুপারমার্কেট, সিফুড প্রসেসিং কারখানা, হোটেল ও পাইকারি আড়তদারদের জন্য সরাসরি ঘাট ও ঘের থেকে সংগৃহীত তাজা মাছের বাল্ক স্টক।
              </p>
            </div>
          </div>

          {/* Clean 2-Tab Bar with Top 'চাহিদা জানান' CTA Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 border-t border-gangchill-ink/10 pt-4">
            {/* Tabs: 'আজকের প্রস্তুত স্টক' & 'সামনে কী আসছে? (আসন্ন আহরণ)' */}
            <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto scrollbar-hide pb-1 max-w-full">
              <button
                type="button"
                onClick={() => handleTabChange('live')}
                className={`relative pb-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'live'
                    ? 'text-gangchill-blue font-bold border-b-2 border-gangchill-blue'
                    : 'text-gangchill-ink/60 hover:text-gangchill-ink'
                }`}
              >
                <span>আজকের প্রস্তুত স্টক</span>
                {liveCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono transition-colors ${
                      activeTab === 'live'
                        ? 'bg-gangchill-blue/10 text-gangchill-blue font-bold'
                        : 'bg-gangchill-ink/5 text-gangchill-ink/60'
                    }`}
                  >
                    {toBanglaDigits(liveCount)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('upcoming')}
                className={`relative pb-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'upcoming'
                    ? 'text-gangchill-blue font-bold border-b-2 border-gangchill-blue'
                    : 'text-gangchill-ink/60 hover:text-gangchill-ink'
                }`}
              >
                <span>সামনে কী আসছে? (আসন্ন আহরণ)</span>
                {upcomingCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono transition-colors ${
                      activeTab === 'upcoming'
                        ? 'bg-gangchill-blue/10 text-gangchill-blue font-bold'
                        : 'bg-gangchill-ink/5 text-gangchill-ink/60'
                    }`}
                  >
                    {toBanglaDigits(upcomingCount)}
                  </span>
                )}
              </button>
            </div>

            {/* Small Top CTA: চাহিদা জানান → or Locked state */}
            <button
              type="button"
              disabled={isMaintenanceMode}
              onClick={() => {
                if (!isMaintenanceMode) setIsRequirementModalOpen(true);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs self-start sm:self-auto group ${
                isMaintenanceMode
                  ? 'bg-rose-600 hover:bg-rose-600 text-white border border-rose-700 cursor-not-allowed opacity-90'
                  : 'text-gangchill-blue bg-white/80 backdrop-blur-md hover:bg-gangchill-blue hover:text-white border border-gangchill-blue/30 cursor-pointer'
              }`}
            >
              {isMaintenanceMode ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-white" />
                  <span>🔒 চাহিদা জানান — বর্তমানে বন্ধ</span>
                  <span className="text-[10px] bg-rose-800/70 text-white px-1.5 py-0.5 rounded font-bold">লক</span>
                </>
              ) : (
                <>
                  <ClipboardList className="w-3.5 h-3.5 text-gangchill-blue group-hover:text-white transition-colors" />
                  <span>চাহিদা জানান</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </>
              )}
            </button>
          </div>

          {/* In-page Maintenance Notice for Buyers */}
          {isMaintenanceMode && (
            <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <strong className="font-bold font-serifBangla text-rose-900 block sm:inline mr-1">
                    ⚠️ রক্ষণাবেক্ষণ বিজ্ঞপ্তি:
                  </strong>
                  <span>
                    {platformSettings?.maintenanceMessage || 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।'}
                  </span>
                </div>
              </div>
              <a
                href={`tel:${platformSettings?.emergencyHotline || platformSettings?.supportPhone || '+8801711234567'}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs shrink-0 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>জরুরি কল: {platformSettings?.emergencyHotline || platformSettings?.supportPhone || '+880 1711-234567'}</span>
              </a>
            </div>
          )}
        </div>

        {/* 3-Column Product Cards Grid (1 col mobile, 2 cols tablet, 3 cols desktop) */}
        {loading ? (
          <div className="py-20 text-center text-sm text-gangchill-ink/50 font-mono">
            মাছের স্টক বোর্ড লোড হচ্ছে...
          </div>
        ) : stocks.length === 0 ? (
          <div className="py-20 text-center text-sm text-gangchill-ink/60">
            বর্তমানে এই বিভাগে কোনো স্টক পাওয়া যায়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {stocks.map((stock, idx) => (
              <WholesaleStockCard key={stock.id} stock={stock} index={idx} />
            ))}
          </div>
        )}

        {/* Bottom Procurement Banner: যেটা খুঁজছেন, তালিকায় নেই? */}
        <div className="liquid-glass-card mt-16 sm:mt-24 p-6 sm:p-12 rounded-2xl sm:rounded-[28px] border border-white/90 shadow-glass text-center max-w-3xl mx-auto space-y-4 relative overflow-hidden">
          {/* Subtle decorative background wave */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-cyan-400/10 pointer-events-none blur-2xl" />
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-blue-600/10 pointer-events-none blur-2xl" />

          <div className="inline-flex items-center gap-1.5 text-xs font-bangla font-semibold text-gangchill-blue bg-gangchill-blue/10 px-3 py-1 rounded-full border border-gangchill-blue/20">
            <Sparkles className="w-3.5 h-3.5 text-gangchill-cyan" />
            <span>সরাসরি সোর্সিং সেবা</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold font-serifBangla text-gangchill-ink">
            যেটা খুঁজছেন, তালিকায় নেই?
          </h3>

          <p className="text-sm sm:text-base text-gangchill-ink/75 leading-relaxed font-light max-w-xl mx-auto">
            আপনার কী মাছ, কত পরিমাণে এবং কবে প্রয়োজন—আমাদের জানান। Gangchill সোর্সিং টিম আপনার প্রয়োজন অনুযায়ী ঘাট ও ঘের থেকে স্টক খুঁজে দ্রুত সরবরাহ নিশ্চিত করবে।
          </p>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setIsRequirementModalOpen(true)}
              className="px-6 py-3 rounded-natural bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white text-sm font-semibold shadow-xs transition-all duration-200 inline-flex items-center gap-2 cursor-pointer group"
            >
              <span>চাহিদা জানান</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </Container>

      {/* Corporate Requirement Modal */}
      <CorporateRequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
      />
    </div>
  );
};
