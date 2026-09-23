import React, { useState, useEffect } from 'react';
import {
  Waves,
  Send,
  Fish,
  User,
  RefreshCw,
  AlertTriangle,
  Phone,
  Lock
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { SuccessState } from '../../components/common/SuccessState';
import { ImageUploadMock } from '../../components/forms/ImageUploadMock';
import { submissionService } from '../../services/submissionService';
import { adminService } from '../../services/adminService';
import { normalizeBanglaToEnglishDigits } from '../../utils/formatters';
import { Seo, SEO_SITE_URL } from '../../components/seo/Seo';

export const SellPage: React.FC = () => {
  const [settings, setSettings] = useState(() => adminService.getSettings());

  useEffect(() => {
    adminService.fetchSettings().then((fresh) => {
      if (fresh) setSettings(fresh);
    }).catch(console.error);

    const onUpdate = (e: any) => {
      setSettings(e.detail || adminService.getSettings());
    };
    window.addEventListener('gangchill_settings_updated', onUpdate);
    return () => window.removeEventListener('gangchill_settings_updated', onUpdate);
  }, []);
  // -------------------------------------------------------------
  // SUPPLY / HARVEST SUBMISSION (কৃষক/জেলে মাছ সরবরাহ ও বিক্রি)
  // -------------------------------------------------------------
  const [supplyFarmerName, setSupplyFarmerName] = useState('');
  const [supplyPhone, setSupplyPhone] = useState('');
  const [supplyDistrict, setSupplyDistrict] = useState('চাঁদপুর');
  const [supplyLocation, setSupplyLocation] = useState('');
  const [supplyProductName, setSupplyProductName] = useState('');
  const [supplyQuantity, setSupplyQuantity] = useState('');
  const [supplyUnit, setSupplyUnit] = useState('কেজি (KG)');
  const [supplyAvailabilityDate, setSupplyAvailabilityDate] = useState('');
  const [supplyExpectedPrice, setSupplyExpectedPrice] = useState('');
  const [supplyDescription, setSupplyDescription] = useState('');
  const [supplyImages, setSupplyImages] = useState<string[]>([]);
  const [supplyStockType, setSupplyStockType] = useState<'current' | 'upcoming'>('current');

  const [supplyErrors, setSupplyErrors] = useState<Record<string, string>>({});
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [supplySubmittedId, setSupplySubmittedId] = useState<string | null>(null);

  const districts = [
    'চাঁদপুর', 'খুলনা', 'সাতক্ষীরা', 'বরিশাল', 'ভোলা',
    'কক্সবাজার', 'ময়মনসিংহ', 'সুনামগঞ্জ', 'যশোর', 'নাটোর',
    'বাগেরহাট', 'পটুয়াখালী', 'কিশোরগঞ্জ', 'চট্টগ্রাম', 'অন্যান্য'
  ];

  const validateSupply = () => {
    const errs: Record<string, string> = {};
    if (!supplyFarmerName.trim()) errs.supplyFarmerName = 'আপনার নামটি লিখুন';
    const normalizedPhone = normalizeBanglaToEnglishDigits(supplyPhone.replace(/[\s-]/g, ''));
    if (!supplyPhone.trim()) {
      errs.supplyPhone = 'মোবাইল নম্বর লিখুন';
    } else if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      errs.supplyPhone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)';
    }
    if (!supplyProductName.trim()) errs.supplyProductName = 'কী মাছ বিক্রি করতে চান লিখুন';
    const parsedQty = parseFloat(normalizeBanglaToEnglishDigits(supplyQuantity));
    if (!supplyQuantity || isNaN(parsedQty) || parsedQty <= 0) {
      errs.supplyQuantity = 'পরিমাণ উল্লেখ করুন (১ বা তার বেশি)';
    }
    if (!supplyLocation.trim()) errs.supplyLocation = 'ঘাট, ঘের বা এলাকার নাম লিখুন';

    setSupplyErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.maintenanceMode) {
      setSupplyErrors({ form: 'বর্তমানে আমাদের ওয়েবসাইটে সাময়িক রক্ষণাবেক্ষণের কাজ চলছে। নতুন তথ্য জমা সাময়িকভাবে স্থগিত।' });
      return;
    }
    if (!validateSupply()) return;

    setSupplyLoading(true);
    try {
      const res = await submissionService.submitFarmerStock({
        farmerName: supplyFarmerName.trim(),
        phone: normalizeBanglaToEnglishDigits(supplyPhone.replace(/[\s-]/g, '')),
        district: supplyDistrict,
        location: supplyLocation.trim(),
        productName: supplyProductName.trim(),
        stockType: supplyStockType,
        quantity: Number(normalizeBanglaToEnglishDigits(supplyQuantity)),
        unit: supplyUnit,
        availabilityDate: supplyAvailabilityDate || undefined,
        expectedPrice: supplyExpectedPrice ? Number(normalizeBanglaToEnglishDigits(supplyExpectedPrice)) : undefined,
        description: supplyDescription.trim() || undefined,
        images: supplyImages
      });

      if (res.success) {
        setSupplySubmittedId(res.submissionId);
      } else {
        setSupplyErrors({ form: res.message || 'তথ্য জমা দিতে সমস্যা হয়েছে।' });
      }
    } finally {
      setSupplyLoading(false);
    }
  };

  const handleResetSupply = () => {
    setSupplyFarmerName('');
    setSupplyPhone('');
    setSupplyLocation('');
    setSupplyProductName('');
    setSupplyQuantity('');
    setSupplyAvailabilityDate('');
    setSupplyExpectedPrice('');
    setSupplyDescription('');
    setSupplyImages([]);
    setSupplyErrors({});
    setSupplySubmittedId(null);
  };

  const sellStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'মাছ বিক্রি ও ঘাট সরবরাহ — Gangchill',
      url: `${SEO_SITE_URL}/sell`,
      description: 'আপনার ঘের, খামার বা উপকূলীয় ঘাটের তাজা মাছ সরাসরি গাংচিলে ন্যায্য মূল্যে বিক্রি করুন। মধ্যস্বত্বভোগী ছাড়া সরাসরি প্রাতিষ্ঠানিক ক্রেতাদের কাছে পৌঁছে দিন।',
      inLanguage: 'bn-BD',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: SEO_SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'মাছ বিক্রি করুন', item: `${SEO_SITE_URL}/sell` },
      ],
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen py-8 sm:py-16">
      <Seo
        title="মাছ বিক্রি ও ঘাট সরবরাহ | Gangchill (গাংচিল)"
        description="আপনার ঘের, খামার বা উপকূলীয় ঘাটের তাজা মাছ সরাসরি গাংচিলে ন্যায্য মূল্যে বিক্রি করুন। মধ্যস্বত্বভোগী ছাড়া সরাসরি প্রাতিষ্ঠানিক ক্রেতাদের কাছে পৌঁছে দিন।"
        path="/sell"
        keywords={['মাছ বিক্রি', 'মাছের দাম', 'ঘাট সরবরাহ', 'মাছের খামারি', 'চাষী', 'Gangchill']}
        structuredData={sellStructuredData}
      />

      <Container size="md">
        <div className="space-y-8 sm:space-y-10">
          {/* Header & Title Section */}
          <div className="text-center max-w-2xl mx-auto space-y-3.5">
            <div className="inline-flex items-center gap-2 text-xs font-bangla font-semibold text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200/80 shadow-xs">
              <Waves className="w-4 h-4 text-teal-600 animate-pulse" />
              <span>জেলে, চাষি ও আড়তদারদের জন্য সরাসরি সুযোগ</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-slate-900 tracking-tight leading-tight">
              আপনার মাছ Gangchill-কে সরবরাহ করুন
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-bangla">
              নদীতে ধরা হয়েছে বা ঘেরে তোলার প্রস্তুতি চলছে—আপনার মাছের তথ্য সরাসরি আমাদের জানান। সরাসরি ঘাট ও ঘের থেকে ন্যায্যমূল্যে সংগ্রহের ব্যবস্থা নেওয়া হবে।
            </p>
          </div>

          {/* Supply Form or Success State or Closed Notice */}
          {supplySubmittedId ? (
            <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-glass">
              <SuccessState
                title="মাছের তথ্য সফলভাবে গৃহীত হয়েছে!"
                message="ধন্যবাদ! আপনার মাছের বিবরণ Gangchill সোর্সিং টিমের কাছে পৌঁছেছে। আমাদের প্রতিনিধি দ্রুত আপনার সাথে ফোনে কথা বলে সরাসরি ঘাট বা ঘের থেকে সংগ্রহ ও দর চূড়ান্ত করবে।"
                referenceId={supplySubmittedId}
                actionLabel="আরেকটি মাছের তথ্য জানান"
                onAction={handleResetSupply}
                secondaryActionLabel="হোমে ফিরে যান"
                onSecondaryAction={() => window.location.href = '/'}
              />
            </div>
          ) : !settings.allowPublicSellerSubmissions ? (
            <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-10 rounded-2xl border border-amber-200/90 shadow-glass text-center space-y-4">
              <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serifBangla text-slate-900">
                ঘাট প্ল্যাটফর্ম সাবমিশন সাময়িকভাবে স্থগিত
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                বর্তমানে ঘাট ও ঘের থেকে সরাসরি নতুন মাছের লট জমা নেওয়া সাময়িকভাবে স্থগিত রয়েছে। সরাসরি সোর্সিং টিমের সাথে যোগাযোগ করতে অনুগ্রহ করে আমাদের হেল্পলাইনে কল করুন।
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`tel:${settings.emergencyHotline || settings.supportPhone || '+8801712345678'}`}
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-sm"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>হটলাইনে যোগাযোগ করুন: {settings.emergencyHotline || settings.supportPhone || '+880 1712-345678'}</span>
                </a>
                <a
                  href="/"
                  className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-all"
                >
                  <span>হোমপেজে ফিরে যান</span>
                </a>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSupplySubmit}
              className="bg-white/95 backdrop-blur-xl p-5 sm:p-8 rounded-2xl border border-slate-200/90 shadow-glass space-y-5 sm:space-y-6"
            >
              {/* Maintenance Banner inside Form if Maintenance Mode is active */}
              {settings.maintenanceMode && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <strong className="font-bold font-serifBangla text-rose-900 block sm:inline mr-1">
                        ⚠️ রক্ষণাবেক্ষণ বিজ্ঞপ্তি:
                      </strong>
                      <span>
                        {settings.maintenanceMessage || 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।'}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`tel:${settings.emergencyHotline || settings.supportPhone || '+8801712345678'}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs shrink-0 transition-colors shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>জরুরি কল</span>
                  </a>
                </div>
              )}

              {supplyErrors.form && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{supplyErrors.form}</span>
                </div>
              )}
              {/* Stock readiness type selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  মাছের বর্তমান অবস্থা নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSupplyStockType('current')}
                    className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      supplyStockType === 'current'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✓ এখন বিক্রির জন্য প্রস্তুত
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplyStockType('upcoming')}
                    className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                      supplyStockType === 'upcoming'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⏳ সামনে প্রস্তুত হবে
                  </button>
                </div>
              </div>

              {/* 1. Farmer Details */}
              <div className="space-y-3 border-b border-slate-100 pb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  ১. আপনার পরিচয় ও অবস্থান
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      আপনার নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: মো: আবুল কাশেম"
                      value={supplyFarmerName}
                      onChange={(e) => setSupplyFarmerName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    />
                    {supplyErrors.supplyFarmerName && (
                      <p className="text-[11px] text-rose-600">{supplyErrors.supplyFarmerName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      মোবাইল নম্বর <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={supplyPhone}
                      onChange={(e) => setSupplyPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors font-mono"
                    />
                    {supplyErrors.supplyPhone && (
                      <p className="text-[11px] text-rose-600">{supplyErrors.supplyPhone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">জেলা</label>
                    <select
                      value={supplyDistrict}
                      onChange={(e) => setSupplyDistrict(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    >
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      ঘাট / ঘের / এলাকা <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: বড়স্টেশন ঘাট / পাইকগাছা ঘের"
                      value={supplyLocation}
                      onChange={(e) => setSupplyLocation(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    />
                    {supplyErrors.supplyLocation && (
                      <p className="text-[11px] text-rose-600">{supplyErrors.supplyLocation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Catch & Fish Details */}
              <div className="space-y-3 border-b border-slate-100 pb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <Fish className="w-3.5 h-3.5 text-teal-600" />
                  ২. মাছের বিবরণ
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    কী মাছ বিক্রি করতে চান? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: চাঁদপুরের রূপালি ইলিশ / গলদা চিংড়ি / রুই"
                    value={supplyProductName}
                    onChange={(e) => setSupplyProductName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                  {supplyErrors.supplyProductName && (
                    <p className="text-[11px] text-rose-600">{supplyErrors.supplyProductName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      পরিমাণ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="যেমন: ৫০০"
                      value={supplyQuantity}
                      onChange={(e) => setSupplyQuantity(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors font-mono"
                    />
                    {supplyErrors.supplyQuantity && (
                      <p className="text-[11px] text-rose-600">{supplyErrors.supplyQuantity}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">একক</label>
                    <select
                      value={supplyUnit}
                      onChange={(e) => setSupplyUnit(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    >
                      <option value="কেজি (KG)">কেজি (KG)</option>
                      <option value="টন (MT)">টন (MT)</option>
                      <option value="মণ">মণ</option>
                      <option value="কার্টন/বক্স">কার্টন/বক্স</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      কবে থেকে সংগ্রহ করা যাবে?
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={supplyAvailabilityDate}
                      onChange={(e) => setSupplyAvailabilityDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-800">
                      আশানুরূপ দর (প্রতি কেজি ৳) (ঐচ্ছিক)
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ১২০০"
                      value={supplyExpectedPrice}
                      onChange={(e) => setSupplyExpectedPrice(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">
                    মাছ সম্পর্কে কিছু বলতে চান? (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="যেমন: ইলিশ ১ কেজি সাইজ, বরফে ইনসুলেটেড, আজ ভোরের আহরণ..."
                    value={supplyDescription}
                    onChange={(e) => setSupplyDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                  />
                </div>

                <ImageUploadMock onImagesChange={setSupplyImages} label="মাছের ছবি (মোবাইল ক্যামেরা বা গ্যালারি থেকে)" />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={supplyLoading || settings.maintenanceMode}
                className={`w-full py-3.5 sm:py-4 font-bold text-sm sm:text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  settings.maintenanceMode
                    ? 'bg-rose-600 hover:bg-rose-600 text-white cursor-not-allowed opacity-90'
                    : 'bg-[#0B192C] hover:bg-[#15325E] text-white hover:shadow-lg cursor-pointer disabled:opacity-50'
                }`}
              >
                {supplyLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>তথ্য জমা হচ্ছে...</span>
                  </>
                ) : settings.maintenanceMode ? (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>🔒 বিক্রি করুন — বর্তমানে বন্ধ</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gangchill-কে মাছের বিবরণ জানান →</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </Container>
    </div>
  );
};
