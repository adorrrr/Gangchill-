import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container } from '../../components/common/Container';
import { BackButton } from '../../components/common/BackButton';
import { InvestorInterestModal } from '../../components/forms/InvestorInterestModal';
import { InvestmentTimeline } from '../../components/investment/InvestmentTimeline';
import { investmentService } from '../../services/investmentService';
import { InvestmentOpportunity } from '../../types/investment';
import { formatTaka, formatDays, toBanglaDigits, formatQuantity } from '../../utils/formatters';
import { Seo, SEO_SITE_URL } from '../../components/seo/Seo';
import { ShieldAlert, ShieldCheck, AlertTriangle, Lock, Phone } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const InvestmentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [opportunity, setOpportunity] = useState<InvestmentOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
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

  useEffect(() => {
    if (slug) {
      setLoading(true);
      investmentService.getInvestmentBySlug(slug).then((res) => {
        setOpportunity(res);
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) {
    return (
      <>
        <Seo
          title="বিনিয়োগ প্রকল্প লোড হচ্ছে... | Gangchill (গাংচিল)"
          description="গাংচিল মৎস্য বিনিয়োগ প্রকল্পের বিবরণ লোড হচ্ছে।"
          path={`/invest/${slug || ''}`}
          noindex
        />
        <Container className="py-20 text-center font-mono text-sm text-gangchill-ink/50">
          পরিকল্পনার বিবরণ লোড হচ্ছে...
        </Container>
      </>
    );
  }

  if (!opportunity) {
    return (
      <>
        <Seo
          title="বিনিয়োগ পরিকল্পনাটি খুঁজে পাওয়া যায়নি | Gangchill (গাংচিল)"
          description="আপনি যে বিনিয়োগ পরিকল্পনাটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা পাওয়া যায়নি।"
          path={`/invest/${slug || ''}`}
          noindex
        />
        <Container className="py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold font-serifBangla text-gangchill-ink">
            পরিকল্পনাটি খুঁজে পাওয়া যায়নি
          </h2>
          <Link to="/invest" className="text-sm font-semibold text-gangchill-blue hover:text-gangchill-navy underline">
            সকল বিনিয়োগ পরিকল্পনায় ফিরে যান
          </Link>
        </Container>
      </>
    );
  }

  const remainingCapital = Math.max(0, opportunity.requiredCapital - opportunity.raisedCapital);
  const percentage = Math.min(
    Math.round((opportunity.raisedCapital / opportunity.requiredCapital) * 100),
    100
  );
  const isOpen = opportunity.status === 'open';
  const primaryImage = (opportunity.images && opportunity.images.length > 0 && opportunity.images[0])
    ? opportunity.images[0]
    : ((opportunity as any).image || '/hero-fishermen-boat.png');

  const investDetailStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: opportunity.title,
      image: primaryImage,
      description: opportunity.description,
      category: opportunity.category,
      provider: {
        '@type': 'Organization',
        name: 'Gangchill',
        url: SEO_SITE_URL,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: SEO_SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'বিনিয়োগ প্রকল্পসমূহ', item: `${SEO_SITE_URL}/invest` },
        { '@type': 'ListItem', position: 3, name: opportunity.title, item: `${SEO_SITE_URL}/invest/${opportunity.slug}` },
      ],
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen py-8 sm:py-16">
      <Seo
        title={`${opportunity.title} — মৎস্য বিনিয়োগ প্রকল্প | Gangchill (গাংচিল)`}
        description={`${opportunity.description.slice(0, 150)}... লক্ষ্য তহবিল: ${formatTaka(opportunity.requiredCapital)}, মেয়াদ: ${formatDays(opportunity.durationDays)}, প্রফিট শেয়ার: ${toBanglaDigits(opportunity.profitPercentage)}%।`}
        path={`/invest/${opportunity.slug}`}
        image={primaryImage}
        keywords={[opportunity.title, opportunity.category, 'মৎস্য বিনিয়োগ', 'মাছ তহবিল', 'Gangchill']}
        structuredData={investDetailStructuredData}
      />
      <Container size="md">
        <div className="mb-6">
          <BackButton to="/invest" label="বিনিয়োগ তালিকায় ফিরে যান" />
        </div>

        {/* 1. Large Visual */}
        <div className="w-full aspect-16/10 sm:aspect-21/10 overflow-hidden bg-gangchill-surface border border-gangchill-ink/10 mb-8 sm:mb-12">
          <img
            src={primaryImage}
            alt={opportunity.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/hero-fishermen-boat.png';
            }}
          />
        </div>

        {/* 2. Story & Structure */}
        <div className="space-y-8 max-w-3xl">
          <div>
            <div className="text-xs font-bangla font-semibold text-gangchill-blue tracking-wide mb-2">
              Gangchill মাছ সংগ্রহ পরিকল্পনা · {opportunity.location}
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-gangchill-ink leading-tight mb-4">
              {opportunity.title}
            </h1>
            <p className="text-sm sm:text-lg text-gangchill-ink/80 leading-relaxed font-light border-l-2 border-gangchill-blue pl-3 sm:pl-4">
              {opportunity.description}
            </p>
          </div>

          {/* Capital Breakdown Box */}
          <div className="p-4 sm:p-6 bg-gangchill-surface border border-gangchill-border rounded-2xl sm:rounded-natural-lg shadow-warm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-gangchill-ink/8 pb-4">
              <div>
                <div className="text-xs text-gangchill-ink-muted">এই stock সংগ্রহের জন্য Gangchill তুলছে:</div>
                <div className="text-2xl sm:text-4xl font-bold font-serifBangla text-gangchill-blue">
                  {formatTaka(opportunity.requiredCapital)}
                </div>
              </div>
              <div className="text-xs font-mono text-gangchill-ink-muted mt-2 sm:mt-0">
                অবশিষ্ট প্রয়োজন: {formatTaka(remainingCapital)} ({toBanglaDigits(percentage)}% সংগৃহীত)
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-[11px] sm:text-sm pt-2">
              <div>
                <span className="text-gangchill-ink-muted block truncate">ন্যূনতম অংশগ্রহণ</span>
                <strong className="text-sm sm:text-base text-gangchill-ink block">{formatTaka(opportunity.minimumInvestment)}</strong>
              </div>
              <div>
                <span className="text-gangchill-ink-muted block truncate">Profit Share</span>
                <strong className="text-sm sm:text-base text-blue-600 font-bold block">{toBanglaDigits(opportunity.profitPercentage)}%</strong>
              </div>
              <div>
                <span className="text-gangchill-ink-muted block truncate">মেয়াদকাল</span>
                <strong className="text-sm sm:text-base text-gangchill-ink block">{formatDays(opportunity.durationDays)}</strong>
              </div>
            </div>
          </div>

          {/* 3. The Transparent Journey: "আমার টাকা কোথায় যাচ্ছে?" */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl sm:text-2xl font-bold font-serifBangla text-gangchill-ink">
              আমার অর্থ কোথায় যাচ্ছে ও কীভাবে পরিচালিত হবে?
            </h2>
            <p className="text-xs sm:text-sm text-gangchill-ink-muted leading-relaxed">
              বিনিয়োগকারীদের অর্থ কোনো কাল্পনিক ফান্ডে নয়, সরাসরি উল্লেখিত মাছ লটের ক্রয় ও কোল্ডচেইন হস্তান্তরে ব্যবহৃত হয়:
            </p>

            <p className="text-xs text-gangchill-ink-muted leading-relaxed">
              {opportunity.procurementPlan.sourceRegion} থেকে {formatQuantity(opportunity.procurementPlan.targetQuantity, opportunity.procurementPlan.unit)} সংগ্রহ করে {opportunity.procurementPlan.targetBuyers}-এর কাছে সরবরাহ করা হবে ({opportunity.procurementPlan.purchaseWindow} সংগ্রহ উইন্ডো, {opportunity.procurementPlan.salesWindow} বিক্রয় উইন্ডো)।
            </p>

            <InvestmentTimeline timeline={opportunity.timeline} />
          </div>

          {/* 3b. Risk & Security Disclosures (previously captured in data but never shown) */}
          {((opportunity.risks && opportunity.risks.length > 0) ||
            (opportunity.securityAndCompliance && opportunity.securityAndCompliance.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
              {opportunity.risks && opportunity.risks.length > 0 && (
                <div className="p-4 sm:p-5 rounded-natural-lg border border-amber-200 bg-amber-50/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>ঝুঁকি বিবেচনা</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-amber-900/90 leading-relaxed list-disc pl-4">
                    {opportunity.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              {opportunity.securityAndCompliance && opportunity.securityAndCompliance.length > 0 && (
                <div className="p-4 sm:p-5 rounded-natural-lg border border-gangchill-border bg-gangchill-surface space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-gangchill-blue">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>নিরাপত্তা ও সম্মতি</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gangchill-ink-muted leading-relaxed list-disc pl-4">
                    {opportunity.securityAndCompliance.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 4. Action */}
          <div className="pt-8 border-t border-gangchill-ink/8">
            {settings.maintenanceMode ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-900 font-bold font-serifBangla">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>⚠️ রক্ষণাবেক্ষণ বিজ্ঞপ্তি</span>
                  </div>
                  <p className="text-rose-900/90 leading-relaxed text-xs">
                    {settings.maintenanceMessage || 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।'}{' '}
                    জরুরি প্রয়োজনে কল করুন:{' '}
                    <a
                      href={`tel:${settings.emergencyHotline || settings.supportPhone || '+8801712345678'}`}
                      className="underline font-bold font-mono inline-flex items-center gap-1 text-slate-950 hover:text-black"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{settings.emergencyHotline || settings.supportPhone || '+880 1712-345678'}</span>
                    </a>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={true}
                  className="w-full sm:w-auto px-4 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-rose-600 hover:bg-rose-600 text-white font-bold text-sm sm:text-base cursor-not-allowed opacity-90 transition-all flex items-center justify-center gap-2 shadow-none text-center"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>🔒 বিনিয়োগ — বর্তমানে বন্ধ</span>
                </button>
              </div>
            ) : !settings.allowPublicInvestorInterest ? (
              <div className="p-5 bg-amber-50/90 border border-amber-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base font-serifBangla">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                  <span>বিনিয়োগ আবেদন মডিউল সাময়িকভাবে স্থগিত</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                  বর্তমানে মৎস্য তহবিল প্রকল্পে নতুন বিনিয়োগ আবেদন ও আগ্রহপত্র গ্রহণ সাময়িকভাবে বন্ধ রয়েছে। বিস্তারিত তথ্যের জন্য আমাদের ইনভেস্টমেন্ট ডেস্কে যোগাযোগ করুন।
                </p>
                <div className="pt-1.5 flex items-center gap-3">
                  <a
                    href={`tel:${settings.emergencyHotline || settings.supportPhone || '+8801712345678'}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-blue-900 underline"
                  >
                    <span>জরুরি হটলাইন: {settings.emergencyHotline || settings.supportPhone || '+880 1712-345678'}</span>
                  </a>
                </div>
              </div>
            ) : isOpen ? (
              <div className="space-y-3">
                <button
                  onClick={() => setIsInterestModalOpen(true)}
                  className="w-full sm:w-auto px-4 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gangchill-blue text-white font-bold text-sm sm:text-base hover:bg-gangchill-navy active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer text-center"
                >
                  <span className="leading-snug">
                    এই সংগ্রহে অংশ নিতে চান?{' '}
                    <span className="font-normal opacity-95 inline-block sm:inline">(আগ্রহ প্রকাশ করুন)</span>
                  </span>
                  <span className="shrink-0 text-base">→</span>
                </button>
                <p className="text-xs text-gangchill-ink-muted">
                  Phase 1-এ কোনো অনলাইন ট্রানজেকশন নেই; প্রাথমিক আগ্রহপত্র গ্রহণের পর Gangchill ইনভেস্টমেন্ট ডেস্ক যোগাযোগ করবে।
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gangchill-surface text-gangchill-ink-muted text-sm font-medium border border-gangchill-border rounded-natural">
                এই প্রকল্পের তহবিল সংগ্রহ সফলভাবে সম্পন্ন হয়েছে।
              </div>
            )}
          </div>
        </div>
      </Container>

      <InvestorInterestModal
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
        opportunity={opportunity}
      />
    </div>
  );
};
