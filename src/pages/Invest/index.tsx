import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { investmentService } from '../../services/investmentService';
import { InvestmentOpportunity } from '../../types/investment';
import { InvestmentCard } from '../../components/investment/InvestmentCard';
import { formatTaka, toBanglaDigits, formatDays } from '../../utils/formatters';
import { COMPANY_CONTACT } from '../../config/constants';
import { Seo, SEO_SITE_URL } from '../../components/seo/Seo';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  PhoneCall,
  FileCheck2,
  Coins,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export const InvestPage: React.FC = () => {
  const [investments, setInvestments] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [settings, setSettings] = useState(() => adminService.getSettings());

  // Interactive Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(100000);
  const [calcDuration, setCalcDuration] = useState<number>(45);
  const [calcRate, setCalcRate] = useState<number>(8.5);

  useEffect(() => {
    adminService.fetchSettings().then((fresh) => {
      if (fresh) setSettings(fresh);
    }).catch(console.error);

    const onSettingsUpdate = (e: any) => {
      setSettings(e.detail || adminService.getSettings());
    };
    window.addEventListener('gangchill_settings_updated', onSettingsUpdate);
    return () => window.removeEventListener('gangchill_settings_updated', onSettingsUpdate);
  }, []);

  useEffect(() => {
    const refreshData = () => {
      setLoading(true);
      investmentService.getInvestments().then((res) => {
        setInvestments(res);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    };

    refreshData();

    const onUpdate = () => refreshData();
    window.addEventListener('gangchill_investments_updated', onUpdate);
    window.addEventListener('focus', onUpdate);
    return () => {
      window.removeEventListener('gangchill_investments_updated', onUpdate);
      window.removeEventListener('focus', onUpdate);
    };
  }, []);

  // Filtered Investments
  // Note: InvestmentStatus has three values ('open' | 'funded' | 'closed'), but the
  // UI only offers two non-'all' tabs. 'funded' is treated as completed, alongside
  // 'closed', so a fully-funded project doesn't disappear from both tabs.
  const filteredInvestments = investments.filter((inv) => {
    const matchesStatus =
      activeStatusFilter === 'all'
        ? true
        : activeStatusFilter === 'open'
        ? inv.status === 'open'
        : inv.status === 'closed' || inv.status === 'funded';

    return matchesStatus;
  });

  // Calculated estimated returns
  const calculatedProfit = Math.round((calcAmount * calcRate) / 100);
  const calculatedTotal = calcAmount + calculatedProfit;

  const investStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'মৎস্য প্রকল্পে বিনিয়োগ — Gangchill',
      url: `${SEO_SITE_URL}/invest`,
      description: 'বাংলাদেশের সম্ভাবনাময় মৎস্য সংগ্রহ ও কোল্ডচেইন লজিস্টিক্স প্রকল্পে যৌথ বিনিয়োগের সুযোগ।',
      inLanguage: 'bn-BD',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: SEO_SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'বিনিয়োগ করুন', item: `${SEO_SITE_URL}/invest` },
      ],
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen selection:bg-gangchill-blue/15 selection:text-gangchill-blue pb-20">
      <Seo
        title="মৎস্য প্রকল্পে বিনিয়োগ | Gangchill (গাংচিল)"
        description="বাংলাদেশের সম্ভাবনাময় মৎস্য সংগ্রহ ও কোল্ডচেইন লজিস্টিক্স প্রকল্পে যৌথ বিনিয়োগের সুযোগ। স্বল্পমেয়াদি ও নিরাপদ তহবিল ব্যবস্থাপনা।"
        path="/invest"
        keywords={['মৎস্য বিনিয়োগ', 'মাছ সংগ্রহ তহবিল', 'হালাল বিনিয়োগ', 'স্বল্পমেয়াদী বিনিয়োগ', 'Gangchill']}
        structuredData={investStructuredData}
      />
      {/* 1. HERO SECTION: Masthead & Impact Stats Ribbon */}
      <section className="relative pt-12 sm:pt-16 pb-12 border-b border-gangchill-ink/10 overflow-hidden bg-gradient-to-b from-white/80 via-gangchill-canvas to-gangchill-canvas">
        <Container>
          <div className="max-w-3xl space-y-4 text-left">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bangla font-semibold text-gangchill-blue bg-gangchill-blue/10 px-3 sm:px-3.5 py-1.5 rounded-full border border-gangchill-blue/20 shadow-2xs whitespace-nowrap max-w-full">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gangchill-blue shrink-0" />
              <span className="truncate">বাস্তব মৎস্য সংগ্রহ ও স্বচ্ছ অর্থায়ন প্ল্যাটফর্ম</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serifBangla text-gangchill-ink tracking-tight leading-[1.12]">
              মাছ সংগ্রহ প্রকল্পে বিনিয়োগ।<br />
              <span className="text-gangchill-blue">স্বল্পমেয়াদী ও নিরাপদ মুনাফা।</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gangchill-ink/80 leading-relaxed font-light max-w-2xl">
              সরাসরি নদী ও ঘের থেকে ইলিশ, বাগদা চিংড়ি ও শুঁটকি সংগ্রহে অংশীদার হোন।
              প্রতিটি প্রকল্প শীর্ষস্থানীয় সুপারমার্কেট ও প্রসেসিং প্ল্যান্টের নিশ্চিত ক্রয়াদেশের সাথে সরাসরি সংযুক্ত।
            </p>
          </div>

          {/* 4 Key Platform Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mt-10 sm:mt-12">
            {/* Stat 1 */}
            <div className="p-3 sm:p-5 rounded-2xl liquid-glass-card border border-white/90 shadow-glass">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-bangla font-medium text-gangchill-ink-muted">মোট সংগৃহীত তহবিল</span>
                <Coins className="w-4 h-4 text-gangchill-cyan shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-serifBangla text-gangchill-blue">
                ৳ ১.৮+ কোটি
              </div>
              <div className="text-[10px] sm:text-[11px] text-gangchill-ink-muted mt-1">
                সরাসরি সরবরাহ কার্যক্রমে সফল বিনিয়োগ
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-3 sm:p-5 rounded-2xl liquid-glass-card border border-white/90 shadow-glass">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-bangla font-medium text-gangchill-ink-muted">প্রকল্প সংখ্যা</span>
                <Layers className="w-4 h-4 text-gangchill-cyan shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-serifBangla text-gangchill-ink">
                ১২+ টি লট
              </div>
              <div className="text-[10px] sm:text-[11px] text-gangchill-ink-muted mt-1">
                ১০০% সময়ে পণ্য ডেলিভারি সম্পন্ন
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-3 sm:p-5 rounded-2xl liquid-glass-card border border-white/90 shadow-glass">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-bangla font-medium text-gangchill-ink-muted">গড় মুনাফার হার (ROI)</span>
                <TrendingUp className="w-4 h-4 text-gangchill-cyan shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-serifBangla text-gangchill-blue">
                ৮.৫% - ৯.৫%
              </div>
              <div className="text-[10px] sm:text-[11px] text-gangchill-ink-muted mt-1">
                প্রতি লটে অর্জিত প্রকৃত মুনাফা অংশ
              </div>
            </div>

            {/* Stat 4 */}
            <div className="p-3 sm:p-5 rounded-2xl liquid-glass-card border border-white/90 shadow-glass">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] sm:text-xs font-bangla font-medium text-gangchill-ink-muted">গড় মেয়াদকাল</span>
                <Clock className="w-4 h-4 text-gangchill-cyan shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-serifBangla text-gangchill-ink">
                ৪৫ - ৬০ দিন
              </div>
              <div className="text-[10px] sm:text-[11px] text-gangchill-ink-muted mt-1">
                স্বল্পমেয়াদী মূলধন ও দ্রুত রিটার্ন
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. SECTION: Investment Opportunities Board */}
      <section id="live-portfolio" className="py-12 sm:py-16">
        <Container>
          {/* Header & Filter Controls */}
          {(!settings.allowPublicInvestorInterest || settings.maintenanceMode) && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-950 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                <span>
                  {settings.maintenanceMode
                    ? 'প্ল্যাটফর্মের রক্ষণাবেক্ষণ (Maintenance Mode) চলছে। নতুন বিনিয়োগ আবেদন সাময়িকভাবে স্থগিত রয়েছে।'
                    : 'বর্তমানে মৎস্য তহবিল প্রকল্পে নতুন বিনিয়োগ আবেদন সাময়িকভাবে বন্ধ রয়েছে। বিস্তারিত তথ্যের জন্য আমাদের হটলাইনে যোগাযোগ করুন।'}
                </span>
              </div>
              <a
                href={`tel:${settings.emergencyHotline || settings.supportPhone || '+8801712345678'}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 font-bold text-xs shrink-0 transition-all shadow-xs"
              >
                <span>হটলাইন: {settings.emergencyHotline || settings.supportPhone || '+880 1712-345678'}</span>
              </a>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gangchill-ink/10 mb-8">
            <div>
              <div className="text-xs font-bangla font-semibold tracking-wide text-gangchill-cyan mb-1">
                লাইভ ইনভেস্টমেন্ট পোর্টফোলিও
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold font-serifBangla text-gangchill-ink">
                চলতি ও সম্পন্ন সংগ্রহ পরিকল্পনা
              </h2>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-full liquid-glass border border-white/90 text-xs sm:text-sm font-medium self-start md:self-auto shadow-xs max-w-full overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  activeStatusFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold shadow-xs'
                    : 'text-gangchill-ink/70 hover:text-gangchill-blue'
                }`}
              >
                সকল ({toBanglaDigits(investments.length)})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatusFilter('open')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  activeStatusFilter === 'open'
                    ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold shadow-xs'
                    : 'text-gangchill-ink/70 hover:text-gangchill-blue'
                }`}
              >
                চলতি ({toBanglaDigits(investments.filter((i) => i.status === 'open').length)})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatusFilter('closed')}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                  activeStatusFilter === 'closed'
                    ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold shadow-xs'
                    : 'text-gangchill-ink/70 hover:text-gangchill-blue'
                }`}
              >
                সম্পন্ন ({toBanglaDigits(investments.filter((i) => i.status === 'closed' || i.status === 'funded').length)})
              </button>
            </div>
          </div>


          {/* Cards Grid */}
          {loading ? (
            <div className="py-20 text-center text-sm text-gangchill-ink-muted font-mono">
              পরিকল্পনাসমূহ লোড হচ্ছে...
            </div>
          ) : filteredInvestments.length === 0 ? (
            <div className="py-20 text-center text-sm text-gangchill-ink-muted liquid-glass rounded-2xl border border-white/90 p-8 shadow-glass">
              নির্বাচিত ফিল্টারে বর্তমানে কোনো প্রকল্প নেই।
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filteredInvestments.map((inv) => (
                <InvestmentCard key={inv.id} opportunity={inv} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 3. SECTION: Interactive Investment Calculator */}
      <section className="py-12 sm:py-16">
        <Container>
          <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-[28px] liquid-glass border border-white/90 p-4 sm:p-8 lg:p-10 shadow-glass-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gangchill-ink/10">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bangla font-semibold tracking-wide text-gangchill-cyan mb-1">
                  <Calculator className="w-3.5 h-3.5 text-gangchill-blue" />
                  <span>ইন্টারেক্টিভ সিমুলেটর</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serifBangla text-gangchill-ink">
                  বিনিয়োগ মুনাফা ক্যালকুলেটর
                </h3>
              </div>
              <div className="text-xs text-gangchill-ink-muted font-bangla">
                * গড় ৮.৫% - ৯.০% মুনাফা হারের ওপর ভিত্তি করে
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-center">
              {/* Controls Column */}
              <div className="lg:col-span-7 space-y-6">
                {/* Amount Slider & Presets */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <label className="text-xs font-semibold text-gangchill-ink-muted uppercase">
                      আপনার সম্ভাব্য বিনিয়োগ পরিমাণ
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-serifBangla text-gangchill-blue">
                        {formatTaka(calcAmount)}
                      </span>
                      <input
                        type="number"
                        min="10000"
                        max="5000000"
                        step="5000"
                        value={calcAmount || ''}
                        onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                        className="w-28 px-2 py-1 text-right font-mono text-xs text-gangchill-ink bg-white/80 border border-white/90 rounded-lg shadow-2xs focus:outline-none focus:border-gangchill-blue"
                        placeholder="পরিমাণ লিখুন"
                      />
                    </div>
                  </div>

                  <input
                    type="range"
                    min="50000"
                    max="5000000"
                    step="25000"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gangchill-ink/10 rounded-lg appearance-none cursor-pointer accent-gangchill-blue"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCalcAmount(amt)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                          calcAmount === amt
                            ? 'bg-gangchill-blue text-white border-gangchill-blue font-semibold shadow-xs'
                            : 'liquid-glass text-gangchill-ink/70 border-white/80 hover:border-gangchill-blue/40'
                        }`}
                      >
                        {formatTaka(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration & Profit Rate Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gangchill-ink-muted block mb-1.5 uppercase">
                      মেয়াদকাল নির্বাচন
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCalcDuration(45);
                          setCalcRate(8.5);
                        }}
                        className={`flex-1 py-2 px-3 rounded-natural text-xs font-semibold border transition-all cursor-pointer ${
                          calcDuration === 45
                            ? 'bg-gangchill-blue/15 border-gangchill-blue text-gangchill-blue'
                            : 'liquid-glass border-white/80 text-gangchill-ink/70 hover:border-gangchill-blue/30'
                        }`}
                      >
                        ৪৫ দিন (ইলিশ)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalcDuration(60);
                          setCalcRate(9.0);
                        }}
                        className={`flex-1 py-2 px-3 rounded-natural text-xs font-semibold border transition-all cursor-pointer ${
                          calcDuration === 60
                            ? 'bg-gangchill-blue/15 border-gangchill-blue text-gangchill-blue'
                            : 'liquid-glass border-white/80 text-gangchill-ink/70 hover:border-gangchill-blue/30'
                        }`}
                      >
                        ৬০ দিন (চিংড়ি)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gangchill-ink-muted block mb-1.5 uppercase">
                      প্রত্যাশিত মুনাফার হার
                    </label>
                    <div className="p-2 liquid-glass rounded-natural border border-white/90 text-sm font-bold text-gangchill-blue text-center">
                      {toBanglaDigits(calcRate)}% (নির্দিষ্ট লট মুনাফা)
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Summary Card (Liquid Glass Navy) */}
              <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl liquid-glass-navy text-white shadow-glass-glow border border-white/20 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="text-xs font-bangla font-semibold tracking-wide text-white/80">
                    আনুমানিক রিটার্ন সামারি
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-white/80 block">প্রত্যাশিত নিট লাভ</span>
                    <div className="text-3xl sm:text-4xl font-bold font-serifBangla text-gangchill-cyan">
                      + {formatTaka(calculatedProfit)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/15 flex justify-between items-baseline">
                    <span className="text-xs text-white/80">মূলধন সহ মোট ফেরত:</span>
                    <span className="text-xl font-bold font-serifBangla text-white">
                      {formatTaka(calculatedTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline text-xs text-white/70">
                    <span>ফেরতের সম্ভাব্য সময়:</span>
                    <span className="font-semibold text-white">{formatDays(calcDuration)}-এর মধ্যে</span>
                  </div>
                </div>

                <a
                  href="#live-portfolio"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('live-portfolio')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-3 rounded-natural bg-white text-gangchill-navy font-bold text-center text-sm font-serifBangla hover:bg-cyan-50 transition-colors shadow-glass inline-flex items-center justify-center gap-2"
                >
                  <span>চলমান প্রকল্পে অংশ নিন</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. SECTION: Why Invest with Gangchill (4 Trust Pillars) */}
      <section className="py-14 sm:py-20 border-b border-gangchill-ink/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-xs font-bangla font-semibold tracking-wide text-gangchill-cyan">
              নিরাপত্তা ও স্বচ্ছতা
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serifBangla text-gangchill-ink">
              কেন Gangchill সংগ্রহ অর্থায়ন নিরাপদ?
            </h2>
            <p className="text-sm sm:text-base text-gangchill-ink/75 font-light">
              সরাসরি বাস্তব পণ্যের কেনাবেচা এবং কোল্ডচেইন লজিস্টিকসের প্রতিটি ধাপে স্বচ্ছতার নিশ্চয়তা।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl liquid-glass-card border border-white/90 shadow-glass space-y-3">
              <div className="w-10 h-10 rounded-full bg-gangchill-blue/10 text-gangchill-blue flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold font-serifBangla text-gangchill-ink">
                বাস্তব মৎস্য সম্পদের ব্যাকড
              </h4>
              <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
                কোনো কাল্পনিক ট্রেডিং নয়; দেশের শীর্ষ সুপারশপ ও প্রসেসিং প্ল্যান্টের কনফার্মড পারচেজ অর্ডারের ভিত্তিতে মাছ সংগ্রহ হয়।
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl liquid-glass-card border border-white/90 shadow-glass space-y-3">
              <div className="w-10 h-10 rounded-full bg-gangchill-cyan/10 text-gangchill-cyan flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold font-serifBangla text-gangchill-ink">
                আইনি ডিজিটাল চুক্তিপত্র
              </h4>
              <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
                প্রতিটি বিনিয়োগের বিপরীতে আইনি অংশীদারিত্ব চুক্তিপত্র, মানি রিসিপ্ট ও ব্যাংক লেনদেনের স্বচ্ছ অডিট ট্রেল প্রদান করা হয়।
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl liquid-glass-card border border-white/90 shadow-glass space-y-3">
              <div className="w-10 h-10 rounded-full bg-gangchill-blue/10 text-gangchill-blue flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold font-serifBangla text-gangchill-ink">
                স্বল্পমেয়াদী ও দ্রুত নিষ্পত্তি
              </h4>
              <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
                দীর্ঘমেয়াদে টাকা আটকে থাকে না; ৪৫ থেকে ৬০ দিনের মধ্যে চালান ডেলিভারি শেষে সরাসরি ব্যাংক অ্যাকাউন্টে আসল ও মুনাফা পাঠানো হয়।
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl liquid-glass-card border border-white/90 shadow-glass space-y-3">
              <div className="w-10 h-10 rounded-full bg-gangchill-cyan/10 text-gangchill-cyan flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold font-serifBangla text-gangchill-ink">
                কোল্ডচেইন ডিজিটাল ট্র্যাকিং
              </h4>
              <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
                ঘাট থেকে ট্রলারে আহরণ, গ্রেডিং, আইসিং ও রেফ্রিজারেটেড পরিবহন—প্রতিটি ধাপ নিয়মিত আপডেট ও পর্যালোচনার আওতায় থাকে।
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. SECTION: How It Works (3 Steps) */}
      <section className="py-14 sm:py-20 border-b border-gangchill-ink/10">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-xs font-bangla font-semibold tracking-wide text-gangchill-cyan">
              সহজ প্রক্রিয়া
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serifBangla text-gangchill-ink">
              ৩টি সহজ ধাপে কীভাবে অংশ নেবেন?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 sm:p-8 rounded-2xl liquid-glass-card border border-white/90 shadow-glass space-y-4 relative">
              <div className="text-xs font-bangla font-bold text-gangchill-blue px-3 py-1 rounded-full bg-gangchill-blue/10 inline-block">
                ধাপ ০১
              </div>
              <h3 className="text-xl font-bold font-serifBangla text-gangchill-ink">
                পরিকল্পনা ও লট বাছাই করুন
              </h3>
              <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
                চলমান ইলিশ, চিংড়ি বা শুঁটকি সংগ্রহ প্রকল্পের প্রয়োজনীয় মূলধন, মেয়াদ, রিটার্ন হার ও ডেলিভারি সূচি বিস্তারিত যাচাই করুন।
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 sm:p-8 rounded-2xl liquid-glass-card border border-white/90 shadow-glass space-y-4 relative">
              <div className="text-xs font-bangla font-bold text-gangchill-cyan px-3 py-1 rounded-full bg-gangchill-cyan/10 inline-block">
                ধাপ ০২
              </div>
              <h3 className="text-xl font-bold font-serifBangla text-gangchill-ink">
                স্বচ্ছ অর্থায়ন ও চুক্তিপত্র গ্রহণ
              </h3>
              <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
                আপনার কাঙ্ক্ষিত পরিমাণ নির্বাচন করে অনলাইন ব্যাংক ট্রান্সফারের মাধ্যমে অর্থ জমা দিন এবং তাৎক্ষণিক ডিজিটাল চুক্তিপত্র ও রিসিপ্ট পান।
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 sm:p-8 rounded-2xl liquid-glass-card border border-white/90 shadow-glass space-y-4 relative">
              <div className="text-xs font-bangla font-bold text-gangchill-blue px-3 py-1 rounded-full bg-gangchill-blue/10 inline-block">
                ধাপ ০৩
              </div>
              <h3 className="text-xl font-bold font-serifBangla text-gangchill-ink">
                পণ্য সরবরাহ ও মুনাফা ফেরত
              </h3>
              <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
                নির্ধারিত তারিখে পণ্য সরবরাহ ও হিসাব নিষ্পত্তির সাথে সাথে আপনার মূলধন ও অর্জিত মুনাফা সরাসরি ব্যাংক অ্যাকাউন্টে জমা হবে।
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. SECTION: Institutional & High-Volume Investor Consultation Banner */}
      <section className="pt-14 sm:pt-20">
        <Container>
          <div className="rounded-2xl sm:rounded-[28px] liquid-glass-navy text-white p-6 sm:p-12 relative overflow-hidden border border-white/20 shadow-glass-glow">
            {/* Ambient background glowing circles */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gangchill-blue/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gangchill-cyan/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bangla font-semibold text-cyan-300 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15">
                <Sparkles className="w-3.5 h-3.5" />
                <span>করপোরেট ও প্রাতিষ্ঠানিক তহবিল সেবা</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-bold font-serifBangla text-white leading-tight">
                বৃহৎ পরিসরে বা প্রাতিষ্ঠানিক বিনিয়োগে আগ্রহী?
              </h3>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed font-light">
                ১০ লক্ষ টাকা বা তদূর্ধ্ব প্রাতিষ্ঠানিক বা করপোরেট পোর্টফোলিও ব্যবস্থাপনা, কাস্টম সংগ্রহ লট ও বিশেষ চুক্তির জন্য আমাদের ইনভেস্টমেন্ট অ্যাডভাইজরি টিমের সাথে সরাসরি আলোচনা করুন।
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-4">
                <Link
                  to="/contact"
                  className="px-6 py-3 rounded-natural bg-white text-gangchill-navy font-bold text-sm font-serifBangla hover:bg-cyan-50 transition-colors shadow-glass inline-flex items-center gap-2"
                >
                  <span>পরামর্শের জন্য যোগাযোগ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 font-mono">
                  <PhoneCall className="w-4 h-4 text-cyan-300" />
                  <span>হটলাইন: {COMPANY_CONTACT.mobileHotlineDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
