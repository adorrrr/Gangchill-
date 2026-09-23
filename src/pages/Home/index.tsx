import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { stockService } from '../../services/stockService';
import { Stock } from '../../types/stock';
import { FeaturedStockCarousel } from '../../components/stock/FeaturedStockCarousel';
import { UpcomingStockCard } from '../../components/stock/UpcomingStockCard';
import { HeroWaterRipple } from '../../components/effects/HeroWaterRipple';
import { Seo, SEO_SITE_NAME, SEO_SITE_URL } from '../../components/seo/Seo';
import { COMPANY_CONTACT } from '../../config/constants';
import { adminService } from '../../services/adminService';
import {
  ChevronDown,
  ArrowRight,
  Scale,
  Truck,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  Lock,
  AlertTriangle
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [platformSettings, setPlatformSettings] = useState(() => adminService.getSettings());
  const [liveStocks, setLiveStocks] = useState<Stock[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [upcomingStocks, setUpcomingStocks] = useState<Stock[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    adminService.fetchSettings().then((s) => {
      if (s) setPlatformSettings(s);
    }).catch(() => {});

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
    const fetchStocks = () => {
      stockService.getLiveStocks(12).then((res) => {
        setLiveStocks(res);
        setLoadingFeatured(false);
      });
      stockService.getUpcomingStocks(4).then(setUpcomingStocks);
    };

    fetchStocks();

    const handleUpdate = () => {
      fetchStocks();
    };

    window.addEventListener('gangchill_stocks_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('gangchill_stocks_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const faqs = [
    {
      question: 'গাংচিল মূলত কীভাবে কাজ করে?',
      answer:
        'গাংচিল হলো একটি আধুনিক সীফুড ও মাছের সাপ্লাই-চেইন প্ল্যাটফর্ম। আমরা উপকূলীয় ঘাট (যেমন কক্সবাজার, বরগুনা, ভোলা), নদী এবং স্বনামধন্য ঘের থেকে সরাসরি তাজা মাছ ও চিংড়ি সংগ্রহ করে কর্পোরেট প্রতিষ্ঠান, সুপারশপ, হোটেল, রেস্তোরাঁ ও পাইকারি ক্রেতাদের কাছে পৌঁছে দিই।',
    },
    {
      question: 'পাইকারি মাছ কীভাবে অর্ডার বা কেনা যায়?',
      answer:
        'আমাদের ওয়েবসাইটের "আজকের সংগ্রহ" ও "সব স্টক" পাতা থেকে বর্তমান তাজা মাছের লাইভ লট দেখে সরাসরি রিকোয়ারমেন্ট জমা দিতে পারেন। এছাড়া আপনার যদি নিয়মিত বড় লট বা নির্দিষ্ট সাইজের গ্রেডের মাছের প্রয়োজন হয়, তবে "মাছের চাহিদা জানান" ফর্মের মাধ্যমে জানালে আমাদের সেলস টিম দ্রুত যোগাযোগ করবে।',
    },
    {
      question: 'মাছের সতেজতা ও কোল্ড-চেইন কীভাবে নিশ্চিত করা হয়?',
      answer:
        'মাছ আহরণ বা ঘাট থেকে খালাসের সাথে সাথেই ফুড-গ্রেড আইস ও ইনসুলেটেড ক্রেটে প্যাক করা হয়। এরপর তাপমাত্রা নিয়ন্ত্রিত রেফার লজিস্টিক্সে দ্রুত পরিবহন করে নির্ধারিত সময়ের মধ্যে ক্রেতার ঠিকানায় পৌঁছে দেওয়া হয়। আমরা যেকোনো প্রকার কৃত্রিম রাসায়নিক বা ফরমালিন সম্পূর্ণভাবে বর্জন করি।',
    },
    {
      question: 'চাষী ও জেলেরা কীভাবে গাংচিলে মাছ বিক্রি করতে পারবেন?',
      answer:
        'আমাদের "বিক্রি করুন" অপশনে গিয়ে চাষী বা ব্যবসায়ীরা মাছের প্রজাতি, আনুমানিক পরিমাণ, অবস্থান ও ছবি আপলোড করতে পারেন। আমাদের ফিল্ড প্রকিউরমেন্ট টিম তথ্য পাওয়ার পর সরাসরি যাচাই করে ন্যায্য মূল্যে সরাসরি ঘাট বা ঘের থেকেই মাছ সংগ্রহের ব্যবস্থা করে।',
    },
    {
      question: 'ন্যূনতম অর্ডারের পরিমাণ কত এবং ডেলিভারি এলাকা কোথায়?',
      answer:
        'গাংচিল মূলত পাইকারি ও বাল্ক ভলিউমে বাণিজ্য পরিচালনা করে। প্রজাতিভেদে সাধারণত ন্যূনতম ২০-৫০ কেজি থেকে শুরু করে টন পর্যন্ত অর্ডার নেওয়া হয়। বর্তমানে ঢাকা মেট্রো সহ প্রধান বিভাগীয় শহর ও বাণিজ্যিক কেন্দ্রগুলোতে আমাদের কোল্ড-চেইন ডেলিভারি নেটওয়ার্ক কার্যকর রয়েছে।',
    },
  ];

  const scrollToContent = () => {
    const section = document.getElementById('live-stocks-board');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const homeStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SEO_SITE_NAME,
      url: SEO_SITE_URL,
      description: 'গাংচিল — পাইকারি মাছ ও সামুদ্রিক খাদ্যের জন্য একটি নির্ভরযোগ্য B2B/B2C বাণিজ্যিক প্ল্যাটফর্ম।',
      inLanguage: 'bn-BD',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Gangchill',
      alternateName: 'গাংচিল',
      url: SEO_SITE_URL,
      logo: `${SEO_SITE_URL}/gangchill-logo-navbar.png`,
      email: COMPANY_CONTACT.email,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: COMPANY_CONTACT.hotlineTel,
        contactType: 'customer service',
        areaServed: 'BD',
        availableLanguage: ['Bengali', 'English'],
      },
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen selection:bg-gangchill-blue/15 selection:text-gangchill-blue">
      <Seo
        title="Gangchill (গাংচিল) — পাইকারি মাছের বাণিজ্যিক প্ল্যাটফর্ম"
        description="গাংচিল — পাইকারি মাছ ও সামুদ্রিক খাদ্যের জন্য একটি নির্ভরযোগ্য B2B/B2C বাণিজ্যিক প্ল্যাটফর্ম। সরাসরি ঘাট ও ঘের থেকে তাজা মাছ কিনুন, বিক্রি করুন এবং মৎস্য প্রকল্পে বিনিয়োগ করুন।"
        path="/"
        keywords={['গাংচিল', 'পাইকারি মাছ', 'মাছের বাজার', 'ইলিশ মাছ', 'চিংড়ি', 'কোল্ডচেইন লজিস্টিকস', 'মৎস্য বিনিয়োগ', 'Gangchill']}
        structuredData={homeStructuredData}
      />

      {/* 1. HERO SECTION — Full Size Canvas Background Image with Interactive Click-Water Ripple */}
      <section className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex flex-col justify-between pt-12 sm:pt-16 pb-12 border-b border-gangchill-ink/8 overflow-hidden">
        {/* Full Canvas Background Image with Click-Triggered Water Surface Effect */}
        <div className="absolute inset-0 z-0">
          <HeroWaterRipple
            src="/hero-fishermen-boat.png"
            alt="গাংচিল — নদী ও ঘেরে মাছ আহরণ ও বাণিজ্য"
            imgClassName="contrast-[1.05] brightness-[1.02]"
            contrast={1.05}
            brightness={1.02}
          />
          {/* Subtle ice daylight gradient overlay for perfect readability with rich photo visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-gangchill-canvas/94 via-gangchill-canvas/75 to-gangchill-canvas/20 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gangchill-canvas/90 via-transparent to-gangchill-canvas/25" />
          {/* Cinematic black + deep navy grade for added depth, concentrated where it
              won't fight the text-readability gradients above (top-right corner and a
              light overall cool tint) */}
          <div className="absolute inset-0 bg-gangchill-navy/10 mix-blend-multiply pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 92% 8%, rgba(6, 14, 26, 0.55) 0%, rgba(11, 25, 44, 0.18) 45%, transparent 72%)',
            }}
          />
        </div>

        {/* Hero Content positioned over the full canvas */}
        <div className="relative z-10 my-auto">
          <Container>
            <div className="max-w-2xl space-y-6 text-left">
              {/* Top Subtitle or Maintenance Pill */}
              {isMaintenanceMode ? (
                <div className="inline-flex items-center gap-2 text-xs font-bangla text-rose-800 font-bold bg-rose-100/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-rose-300 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                  <span>🔧 সাময়িক রক্ষণাবেক্ষণ চলছে</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bangla text-gangchill-blue font-semibold bg-white/80 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full border border-blue-900/10 shadow-2xs whitespace-nowrap max-w-full">
                  <span className="w-2 h-2 rounded-full bg-gangchill-blue animate-pulse shrink-0" />
                  <span className="truncate">বাংলাদেশের মাছের বাণিজ্যের নতুন সংযোগ</span>
                </div>
              )}

              {/* Large Confident Bangla Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serifBangla text-gangchill-ink leading-[1.18] sm:leading-[1.12] tracking-tight">
                নদী থেকে বাজার।<br />
                সরাসরি সংযোগ।
              </h1>

              {/* Supporting Copy or Short Maintenance Notice */}
              {isMaintenanceMode ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/95 border border-rose-200 text-rose-950 max-w-xl shadow-xs space-y-1 animate-fade-in">
                  <p className="text-xs sm:text-sm font-semibold font-bangla leading-relaxed flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {platformSettings?.maintenanceMessage || 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।'}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm sm:text-lg text-gangchill-ink/80 leading-relaxed font-normal max-w-xl">
                  দেশি মাছ, চিংড়ি, ইলিশ ও শুঁটকি—<br className="hidden sm:inline" />
                  উৎস ঘাট ও ঘের থেকে পাইকারি ক্রেতা পর্যন্ত সহজ, স্বচ্ছ ও বিশ্বস্ত প্ল্যাটফর্ম।
                </p>
              )}

              {/* 3 Core Action Cards — Active or Locked Red States */}
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 max-w-2xl">
                {/* 1. কিনুন */}
                <Link
                  to={isMaintenanceMode ? '#' : '/buy'}
                  onClick={(e) => {
                    if (isMaintenanceMode) e.preventDefault();
                  }}
                  aria-disabled={isMaintenanceMode}
                  className={`group relative overflow-hidden p-4 rounded-2xl transition-all duration-300 transform flex flex-col justify-between ${
                    isMaintenanceMode
                      ? 'bg-rose-600 text-white border border-rose-500 shadow-md cursor-not-allowed opacity-95'
                      : 'backdrop-blur-xl bg-white/75 hover:bg-white/90 active:scale-[0.98] border border-white/90 hover:border-blue-400/40 shadow-glass hover:shadow-glass-glow hover:-translate-y-1'
                  }`}
                >
                  {!isMaintenanceMode && (
                    <>
                      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br from-white/90 via-cyan-300/20 to-transparent blur-md pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </>
                  )}

                  <div className="relative z-10 flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isMaintenanceMode
                          ? 'bg-rose-800/60 text-white border border-rose-400/40'
                          : 'bg-gangchill-blue/10 border border-gangchill-blue/20 text-gangchill-blue shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      }`}
                    >
                      {isMaintenanceMode ? '🔒 স্থগিত' : '০১'}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs ${
                        isMaintenanceMode
                          ? 'bg-rose-700 text-white'
                          : 'bg-gangchill-blue/10 text-gangchill-blue group-hover:bg-gangchill-blue group-hover:text-white'
                      }`}
                    >
                      {isMaintenanceMode ? (
                        <Lock className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`text-base sm:text-lg font-bold font-serifBangla ${
                        isMaintenanceMode
                          ? 'text-white'
                          : 'text-gangchill-ink group-hover:text-gangchill-blue transition-colors'
                      }`}
                    >
                      {isMaintenanceMode ? '🔒 কিনুন — বর্তমানে বন্ধ' : 'কিনুন'}
                    </div>
                    <div
                      className={`text-xs mt-0.5 font-medium ${
                        isMaintenanceMode ? 'text-rose-100' : 'text-gangchill-ink-muted'
                      }`}
                    >
                      {isMaintenanceMode ? 'সাময়িক রক্ষণাবেক্ষণের কাজ চলছে' : 'পাইকারি মাছের লাইভ স্টক'}
                    </div>
                  </div>
                </Link>

                {/* 2. বিক্রি করুন */}
                <Link
                  to={isMaintenanceMode ? '#' : '/sell'}
                  onClick={(e) => {
                    if (isMaintenanceMode) e.preventDefault();
                  }}
                  aria-disabled={isMaintenanceMode}
                  className={`group relative overflow-hidden p-4 rounded-2xl transition-all duration-300 transform flex flex-col justify-between ${
                    isMaintenanceMode
                      ? 'bg-rose-600 text-white border border-rose-500 shadow-md cursor-not-allowed opacity-95'
                      : 'backdrop-blur-xl bg-white/75 hover:bg-white/90 active:scale-[0.98] border border-white/90 hover:border-cyan-400/40 shadow-glass hover:shadow-glass-glow hover:-translate-y-1'
                  }`}
                >
                  {!isMaintenanceMode && (
                    <>
                      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br from-white/90 via-cyan-400/25 to-transparent blur-md pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </>
                  )}

                  <div className="relative z-10 flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isMaintenanceMode
                          ? 'bg-rose-800/60 text-white border border-rose-400/40'
                          : 'bg-gangchill-cyan/10 border border-gangchill-cyan/20 text-gangchill-cyan-deep shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      }`}
                    >
                      {isMaintenanceMode ? '🔒 স্থগিত' : '০২'}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs ${
                        isMaintenanceMode
                          ? 'bg-rose-700 text-white'
                          : 'bg-gangchill-cyan/10 text-gangchill-cyan-deep group-hover:bg-gangchill-cyan group-hover:text-white'
                      }`}
                    >
                      {isMaintenanceMode ? (
                        <Lock className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`text-base sm:text-lg font-bold font-serifBangla ${
                        isMaintenanceMode
                          ? 'text-white'
                          : 'text-gangchill-ink group-hover:text-gangchill-cyan-deep transition-colors'
                      }`}
                    >
                      {isMaintenanceMode ? '🔒 বিক্রি করুন — বর্তমানে বন্ধ' : 'বিক্রি করুন'}
                    </div>
                    <div
                      className={`text-xs mt-0.5 font-medium ${
                        isMaintenanceMode ? 'text-rose-100' : 'text-gangchill-ink-muted'
                      }`}
                    >
                      {isMaintenanceMode ? 'সাময়িক রক্ষণাবেক্ষণের কাজ চলছে' : 'মাছের তথ্য ও রেডি লট জানান'}
                    </div>
                  </div>
                </Link>

                {/* 3. বিনিয়োগ করুন */}
                <Link
                  to={isMaintenanceMode ? '#' : '/invest'}
                  onClick={(e) => {
                    if (isMaintenanceMode) e.preventDefault();
                  }}
                  aria-disabled={isMaintenanceMode}
                  className={`group relative overflow-hidden p-4 rounded-2xl transition-all duration-300 transform flex flex-col justify-between ${
                    isMaintenanceMode
                      ? 'bg-rose-600 text-white border border-rose-500 shadow-md cursor-not-allowed opacity-95'
                      : 'backdrop-blur-xl bg-white/75 hover:bg-white/90 active:scale-[0.98] border border-white/90 hover:border-amber-400/40 shadow-glass hover:shadow-glass-glow hover:-translate-y-1'
                  }`}
                >
                  {!isMaintenanceMode && (
                    <>
                      <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br from-white/90 via-amber-300/20 to-transparent blur-md pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/10 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </>
                  )}

                  <div className="relative z-10 flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isMaintenanceMode
                          ? 'bg-rose-800/60 text-white border border-rose-400/40'
                          : 'bg-amber-600/10 border border-amber-600/20 text-amber-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                      }`}
                    >
                      {isMaintenanceMode ? '🔒 স্থগিত' : '০৩'}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xs ${
                        isMaintenanceMode
                          ? 'bg-rose-700 text-white'
                          : 'bg-amber-600/10 text-amber-700 group-hover:bg-amber-600 group-hover:text-white'
                      }`}
                    >
                      {isMaintenanceMode ? (
                        <Lock className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div
                      className={`text-base sm:text-lg font-bold font-serifBangla ${
                        isMaintenanceMode
                          ? 'text-white'
                          : 'text-gangchill-ink group-hover:text-amber-700 transition-colors'
                      }`}
                    >
                      {isMaintenanceMode ? '🔒 বিনিয়োগ — বর্তমানে বন্ধ' : 'বিনিয়োগ করুন'}
                    </div>
                    <div
                      className={`text-xs mt-0.5 font-medium ${
                        isMaintenanceMode ? 'text-rose-100' : 'text-gangchill-ink-muted'
                      }`}
                    >
                      {isMaintenanceMode ? 'সাময়িক রক্ষণাবেক্ষণের কাজ চলছে' : 'মাছ সংগ্রহ তহবিল ও প্রকল্প'}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </Container>
        </div>

        {/* Hero Bottom Cue */}
        <div className="relative z-10 mt-12 pt-6">
          <Container>
            <div className="border-t border-gangchill-ink/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gangchill-ink-muted gap-3 pt-4">
              <button
                onClick={scrollToContent}
                className="inline-flex items-center gap-2 text-gangchill-ink hover:text-gangchill-blue transition-colors cursor-pointer group font-medium"
              >
                <span>লাইভ মাছের স্টক দেখুন</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </button>

              <div className="flex items-center gap-2 text-gangchill-ink-muted font-bangla text-xs">
                <span className="w-6 h-px bg-gangchill-ink/20 hidden sm:inline-block" />
                <span>মানুষ · মাছ · বাজার · উন্নত বাংলাদেশ</span>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* 2. SECTION: আজকের সংগ্রহ (Featured Today) */}
      <section id="live-stocks-board" className="py-14 sm:py-24 border-b border-gangchill-ink/10 bg-gangchill-canvas">
        <Container>
          {/* Section Header with Wave Mark & Clean Editorial Lockup */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12">
            <div className="space-y-3">
              {/* Wave Graphic + FEATURED TODAY */}
              <div className="flex items-center gap-2.5">
                <svg className="w-8 h-3 text-gangchill-cyan" viewBox="0 0 32 12" fill="none" aria-hidden="true">
                  <path
                    d="M1 6C4 2 8 2 11 6C14 10 18 10 21 6C24 2 28 2 31 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-gangchill-cyan">
                  FEATURED TODAY
                </span>
              </div>

              {/* Title & Subtext */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-gangchill-ink tracking-tight">
                  আজকের সংগ্রহ
                </h2>
                <p className="text-sm sm:text-base text-gangchill-ink-muted leading-relaxed font-light">
                  নদী, ঘের ও সমুদ্র থেকে বাছাই করা<br className="hidden sm:inline" />
                  তাজা মাছ সরাসরি আপনার ব্যবসার জন্য
                </p>
              </div>
            </div>

            {/* View All Stocks Link */}
            <Link
              to="/buy"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gangchill-ink hover:text-gangchill-blue transition-colors self-start md:self-end group border-b border-gangchill-ink/20 hover:border-gangchill-blue pb-0.5"
            >
              <span>সব স্টক দেখুন</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Featured Today Carousel */}
          <FeaturedStockCarousel stocks={liveStocks} loading={loadingFeatured} />
        </Container>
      </section>

      {/* 3. SECTION: আমাদের সম্পর্কে (About Us / Mission, Supply Chain Value & Cold-Chain Trust) */}
      <section className="py-14 sm:py-24 border-b border-gangchill-ink/10 bg-gradient-to-b from-gangchill-canvas via-white/50 to-gangchill-canvas">
        <Container>
          <div className="max-w-4xl mx-auto text-center space-y-4 mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-gangchill-blue bg-gangchill-blue/10 px-3 py-1 rounded-full border border-gangchill-blue/20">
              ABOUT GANGCHILL · আমাদের পরিচয়
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-gangchill-ink tracking-tight">
              বাংলাদেশের মাছ বাণিজ্যে স্বচ্ছতা ও বিশ্বাসের সেতুবন্ধন
            </h2>
            <p className="text-sm sm:text-base text-gangchill-ink/75 leading-relaxed max-w-2xl mx-auto font-light">
              গাংচিল হলো একটি টেক-ফার্স্ট সীফুড ও মৎস্য সাপ্লাই-চেইন নেটওয়ার্ক। আমরা নদী, ঘের ও সাগরের প্রান্তিক জেলে-চাষীদের সরাসরি আধুনিক পাইকারি ক্রেতাদের সাথে যুক্ত করি।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Pillar 1: Mission */}
            <div className="liquid-glass-card border border-white/90 shadow-glass p-6 sm:p-8 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gangchill-blue/10 text-gangchill-blue flex items-center justify-center font-bold">
                  <span className="font-serifBangla text-lg">০১</span>
                </div>
                <h3 className="text-xl font-bold font-serifBangla text-gangchill-ink">আমাদের লক্ষ্য ও মিশন</h3>
                <p className="text-xs sm:text-sm text-gangchill-ink/75 leading-relaxed font-light">
                  প্রান্তিক জেলে ও খামারিদের কঠোর পরিশ্রমের প্রকৃত স্বীকৃতি দেওয়া এবং আধুনিক পাইকারি বাজারের জন্য নির্ভরযোগ্য ও অবিচ্ছিন্ন সরবরাহ ব্যবস্থা গড়ে তোলা।
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-gangchill-ink/8 text-xs font-semibold text-gangchill-blue flex items-center gap-1.5">
                <span>উৎস থেকে সরাসরি সংযোগ</span>
              </div>
            </div>

            {/* Pillar 2: Supply Chain Value */}
            <div className="liquid-glass-card border border-white/90 shadow-glass p-6 sm:p-8 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gangchill-cyan/10 text-gangchill-cyan-deep flex items-center justify-center font-bold">
                  <span className="font-serifBangla text-lg">০২</span>
                </div>
                <h3 className="text-xl font-bold font-serifBangla text-gangchill-ink">সাপ্লাই চেইন ভ্যালু</h3>
                <p className="text-xs sm:text-sm text-gangchill-ink/75 leading-relaxed font-light">
                  অপ্রয়োজনীয় মধ্যস্বত্বভোগীদের স্তর দূর করে পাইকারি ক্রেতাদের জন্য খরচ কমানো এবং চাষীদের জন্য লাভজনক ও স্থিতিশীল দর নিশ্চিত করা।
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-gangchill-ink/8 text-xs font-semibold text-gangchill-cyan-deep flex items-center gap-1.5">
                <span>স্বচ্ছ ও সুনির্দিষ্ট গ্রেডিং</span>
              </div>
            </div>

            {/* Pillar 3: Cold-Chain Trust */}
            <div className="liquid-glass-card border border-white/90 shadow-glass p-6 sm:p-8 rounded-2xl flex flex-col justify-between transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-gangchill-blue/10 text-gangchill-blue flex items-center justify-center font-bold">
                  <span className="font-serifBangla text-lg">০৩</span>
                </div>
                <h3 className="text-xl font-bold font-serifBangla text-gangchill-ink">কোল্ড-চেইন নিশ্চয়তা</h3>
                <p className="text-xs sm:text-sm text-gangchill-ink/75 leading-relaxed font-light">
                  আহরণ থেকে ডেলিভারি পর্যন্ত কঠোর তাপমাত্রা ও আইসিং বজায় রাখা হয়, যাতে কোনো প্রকার ক্ষতিকারক কেমিক্যাল ছাড়াই মাছের প্রাকৃতিক স্বাদ ও সতেজতা অক্ষুণ্ণ থাকে।
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-gangchill-ink/8 text-xs font-semibold text-gangchill-blue flex items-center gap-1.5">
                <span><span className="font-sans font-bold">100%</span> প্রিজারভেটিভ-মুক্ত</span>
              </div>
            </div>
          </div>

          {/* Clean Contact Action without broken /about route */}
          <div className="mt-10 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gangchill-ink hover:text-gangchill-blue border-b border-gangchill-ink/20 hover:border-gangchill-blue pb-0.5 transition-colors"
            >
              <span>আমাদের কার্যপদ্ধতি ও পাইকারি বাণিজ্য নিয়ে কথা বলুন</span>
              <span>→</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* 4. SECTION: সামনে কী আসছে? (Upcoming Fish Stock) */}
      <section className="py-12 sm:py-16 border-b border-gangchill-ink/10 bg-gangchill-canvas">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-10 pb-4 border-b border-gangchill-ink/12">
            <div>
              <div className="text-xs font-bangla font-semibold tracking-wide text-gangchill-cyan mb-1">
                আসন্ন আহরণ ও জোয়ের মাছ
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serifBangla text-gangchill-ink">
                সামনে কী আসছে?
              </h2>
            </div>
            <Link
              to="/buy?tab=upcoming"
              className="text-sm font-semibold text-gangchill-blue hover:text-gangchill-blue-deep flex items-center gap-1.5 transition-colors"
            >
              <span>আসন্ন সকল মাছ দেখুন</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {upcomingStocks.map((stock, idx) => (
              <UpcomingStockCard key={stock.id} stock={stock} index={idx + 1} />
            ))}
          </div>
        </Container>
      </section>

      {/* 5. SECTION: বিক্রয় করুন (Sell Fish / Farmer & Producer Gateway) */}
      <section className="py-14 sm:py-24 border-b border-gangchill-ink/10 bg-gradient-to-b from-gangchill-canvas via-blue-50/40 to-gangchill-canvas">
        <Container>
          <div className="bg-gradient-to-br from-white/90 via-white/80 to-blue-50/70 backdrop-blur-2xl border border-white/90 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-glass-lg relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Heading & Description */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-bangla font-semibold text-gangchill-blue bg-gangchill-blue/10 px-3 py-1 rounded-full border border-gangchill-blue/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-gangchill-blue animate-pulse" />
                  <span>মাছ চাষী, জেলে ও ঘাট আড়তদারদের জন্য</span>
                </div>

                <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold font-serifBangla text-gangchill-ink leading-[1.25] tracking-tight">
                  আপনার তাজা মাছ বা চিংড়ি<br className="hidden sm:inline" />
                  সরাসরি পাইকারি বাজারে বিক্রি করুন
                </h2>

                <p className="text-sm sm:text-base text-gangchill-ink/75 leading-relaxed font-light max-w-xl">
                  গাংচিল প্ল্যাটফর্মে কোনো অযথা মধ্যস্বত্বভোগী নেই। উপকূলীয় ঘাট বা ঘের থেকে আপনার আহরিত মাছের ধরন, আনুমানিক পরিমাণ ও প্রত্যাশিত দাম জানান—আমাদের প্রকিউরমেন্ট টিম দ্রুততম সময়ে যাচাই করে সরাসরি সংগ্রহের ব্যবস্থা করবে।
                </p>

                {/* 3 Value Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl liquid-glass border border-white/80 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-gangchill-blue/10 text-gangchill-blue flex items-center justify-center mb-2">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold font-serifBangla text-gangchill-ink">ন্যায্য মূল্য</div>
                    <div className="text-xs text-gangchill-ink-muted mt-1 leading-normal">
                      বাজারের প্রকৃত দর অনুযায়ী স্বচ্ছ মূল্য নির্ধারণ
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl liquid-glass border border-white/80 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-gangchill-blue/10 text-gangchill-blue flex items-center justify-center mb-2">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold font-serifBangla text-gangchill-ink">দ্রুত পরিবহন</div>
                    <div className="text-xs text-gangchill-ink-muted mt-1 leading-normal">
                      কোল্ড-চেইনে ঘাট থেকেই মাছ সংগ্রহের সুব্যবস্থা
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl liquid-glass border border-white/80 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-gangchill-blue/10 text-gangchill-blue flex items-center justify-center mb-2">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold font-serifBangla text-gangchill-ink">নিশ্চিত পেমেন্ট</div>
                    <div className="text-xs text-gangchill-ink-muted mt-1 leading-normal">
                      কোনো ঝুলন্ত বাকি নয়, দ্রুত ও নিরাপদ লেনদেন
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <Link
                    to="/sell"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white font-semibold text-sm active:scale-[0.98] transition-all rounded-xl shadow-glass-glow"
                  >
                    <span>মাছ বিক্রির তথ্য জানান</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 liquid-glass border border-gangchill-ink/15 text-gangchill-ink hover:text-gangchill-blue hover:border-gangchill-blue font-medium text-sm transition-all rounded-xl shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4 text-gangchill-blue" />
                    <span>প্রকিউরমেন্ট টিমের সাথে কথা বলুন</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Steps Box */}
              <div className="lg:col-span-5">
                <div className="liquid-glass rounded-2xl p-5 sm:p-7 border border-white/85 shadow-glass space-y-4">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-gangchill-ink-muted">
                    সহজ ৩টি ধাপ
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        ১
                      </div>
                      <div>
                        <div className="text-sm font-bold font-serifBangla text-gangchill-ink">অনলাইনে তথ্য দিন</div>
                        <div className="text-xs text-gangchill-ink-muted mt-0.5">
                          আপনার নাম, মোবাইল নম্বর ও মাছের আনুমানিক পরিমাণ লিখুন।
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        ২
                      </div>
                      <div>
                        <div className="text-sm font-bold font-serifBangla text-gangchill-ink">মান যাচাই ও দর নির্ধারণ</div>
                        <div className="text-xs text-gangchill-ink-muted mt-0.5">
                          আমাদের মাঠ প্রতিনিধি দ্রুত নমুনা ও ছবি দেখে দর চূড়ান্ত করবেন।
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        ৩
                      </div>
                      <div>
                        <div className="text-sm font-bold font-serifBangla text-gangchill-ink">সংগ্রহ ও সরাসরি পরিশোধ</div>
                        <div className="text-xs text-gangchill-ink-muted mt-0.5">
                          ঘাট বা ঘের থেকেই মাছ লোড এবং সাথে সাথেই স্বচ্ছ লেনদেন সম্পন্ন।
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gangchill-ink/10 text-xs text-gangchill-ink/70 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gangchill-blue shrink-0" />
                    <span>উপকূলীয় ও অভ্যন্তরীণ যেকোনো অঞ্চল থেকে মাছ বিক্রির প্রস্তাব জানাতে পারেন</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. SECTION: সচরাচর জিজ্ঞাসা (FAQ — গাংচিল কী কী করে?) */}
      <section className="py-14 sm:py-24 border-b border-gangchill-ink/10 bg-gangchill-canvas">
        <Container size="md">
          {/* Header */}
          <div className="text-center space-y-3 mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-gangchill-blue bg-gangchill-blue/10 px-3 py-1 rounded-full border border-gangchill-blue/20">
              FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-gangchill-ink tracking-tight">
              গাংচিল কী কী করে?
            </h2>
            <p className="text-sm sm:text-base text-gangchill-ink-muted leading-relaxed font-light max-w-xl mx-auto">
              গাংচিলের সেবা, সাপ্লাই চেইন ও পাইকারি সরবরাহ সম্পর্কিত সাধারণ কিছু প্রশ্নের উত্তর
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-3.5 max-w-3xl mx-auto">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 border ${
                    isOpen
                      ? 'bg-white/95 border-gangchill-blue/30 shadow-glass-glow'
                      : 'liquid-glass-card border-white/80'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/40 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-serifBangla font-bold text-base sm:text-lg text-gangchill-ink leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 ${
                        isOpen
                          ? 'bg-gangchill-blue text-white border-gangchill-blue rotate-180 shadow-xs'
                          : 'bg-white text-gangchill-ink-muted border-gangchill-ink/10'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-gangchill-ink/80 leading-relaxed font-light border-t border-gangchill-ink/6 pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 7. Direct Fish Sourcing Prompt for Corporate Buyers */}
      <section className="py-14 sm:py-20 text-center bg-gradient-to-b from-gangchill-canvas to-blue-50/30">
        <Container size="sm">
          <div className="space-y-4 max-w-xl mx-auto liquid-glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-10 border border-white/90 shadow-glass">
            <h3 className="text-2xl sm:text-3xl font-bold font-serifBangla text-gangchill-ink">
              যেটা খুঁজছেন, তালিকায় নেই?
            </h3>
            <p className="text-sm sm:text-base text-gangchill-ink/70 leading-relaxed">
              আপনার প্রতিষ্ঠান বা রেস্তোরাঁর জন্য নির্দিষ্ট কোনো মাছের গ্রেড, সাইজ বা পরিমাণের চাহিদা জানান। Gangchill প্রকিউরমেন্ট টিম ঘাট ও ঘের থেকে সরাসরি খুঁজে দেবে।
            </p>
            <div className="pt-2">
              <Link
                to="/buy?action=demand"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-semibold text-sm shadow-xs transition-all rounded-natural"
              >
                <span>মাছের চাহিদা জানান</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};