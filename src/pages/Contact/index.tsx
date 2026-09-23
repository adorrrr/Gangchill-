import React, { useState } from 'react';
import { Container } from '../../components/common/Container';
import { FormField } from '../../components/forms/FormField';
import { Textarea } from '../../components/forms/Textarea';
import { Button } from '../../components/common/Button';
import { SuccessState } from '../../components/common/SuccessState';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { COMPANY_CONTACT } from '../../config/constants';
import { normalizeBanglaToEnglishDigits } from '../../utils/formatters';
import { submissionService } from '../../services/submissionService';
import { Seo, SEO_SITE_URL } from '../../components/seo/Seo';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; message?: string }>({});
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; phone?: string; message?: string } = {};

    if (!name.trim()) errs.name = 'আপনার নাম লিখুন';
    const normalizedPhone = normalizeBanglaToEnglishDigits(phone.replace(/[\s-]/g, ''));
    if (!phone.trim()) {
      errs.phone = 'মোবাইল নম্বর লিখুন';
    } else if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      errs.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)';
    }
    if (!message.trim()) errs.message = 'আপনার বার্তা বা জিজ্ঞাসা লিখুন';

    setFieldErrors(errs);

    if (Object.keys(errs).length > 0) {
      setError('অনুগ্রহ করে ফরমের সঠিক তথ্য পূরণ করুন');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await submissionService.submitContactMessage({ name, phone, message });
      if (res.success) {
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const contactStructuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'যোগাযোগ ও সহায়তা — Gangchill',
      url: `${SEO_SITE_URL}/contact`,
      description: 'গাংচিল হেড অফিস, পাইকারি মাছের বাল্ক চাহিদা ও যেকোনো সহায়তায় সরাসরি যোগাযোগ করুন।',
      inLanguage: 'bn-BD',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'হোম', item: SEO_SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'যোগাযোগ', item: `${SEO_SITE_URL}/contact` },
      ],
    },
  ];

  return (
    <div className="bg-gangchill-canvas text-gangchill-ink min-h-screen py-10 sm:py-16">
      <Seo
        title="যোগাযোগ ও অনুসন্ধান | Gangchill (গাংচিল)"
        description="গাংচিল হেড অফিস, পাইকারি মাছের বাল্ক চাহিদা, সরবরাহ চুক্তি বা যেকোনো সহায়তায় আমাদের সেলস ও সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করুন।"
        path="/contact"
        keywords={['যোগাযোগ', 'গাংচিল অফিস', 'হোলসেল মাছ অর্ডার', 'কাস্টমার সাপোর্ট', 'Gangchill']}
        structuredData={contactStructuredData}
      />
      <Container size="md">
        <div className="border-b border-gangchill-ink/12 pb-6 mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bangla font-semibold text-gangchill-blue bg-gangchill-blue/10 px-3 py-1 rounded-full border border-gangchill-blue/20 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-gangchill-blue animate-pulse" />
            <span>যোগাযোগ ও সহায়তা</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serifBangla text-gangchill-ink">
            Gangchill টিমের সাথে কথা বলুন
          </h1>
          <p className="text-xs sm:text-base text-gangchill-ink/70">
            মাছের বাল্ক ক্রয়, সরাসরি মাছ সরবরাহ বা স্টক সংগ্রহে অর্থায়ন সংক্রান্ত যেকোনো তথ্যের জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Contact Details */}
          <div className="liquid-glass-card p-5 sm:p-8 rounded-2xl border border-white/90 shadow-glass space-y-6">
            <h2 className="font-bold text-lg font-serifBangla text-gangchill-ink border-b border-gangchill-ink/10 pb-3">
              অফিস ও ঘাট হাব
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gangchill-cyan shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gangchill-ink block">হেড অফিস:</strong>
                  <span className="text-gangchill-ink/70">{COMPANY_CONTACT.headOffice}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gangchill-cyan shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gangchill-ink block">হটলাইন:</strong>
                  <span className="text-gangchill-ink/70">{COMPANY_CONTACT.hotlineDisplay} ({COMPANY_CONTACT.operatingHours})</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gangchill-cyan shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gangchill-ink block">ইমেইল:</strong>
                  <span className="text-gangchill-ink/70 break-all">{COMPANY_CONTACT.email} / {COMPANY_CONTACT.sourcingEmail}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gangchill-cyan shrink-0 mt-0.5" />
                <div>
                  <strong className="text-gangchill-ink block">ঘাট ও সোর্সিং হাব কার্যক্রম:</strong>
                  <span className="text-gangchill-ink/70">{COMPANY_CONTACT.hubLocations}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="liquid-glass p-5 sm:p-8 rounded-2xl border border-white/90 shadow-glass">
            {submitted ? (
              <SuccessState
                title="বার্তা সফলভাবে পৌঁছেছে!"
                message="আপনার বার্তাটি আমাদের সোর্সিং ও কাস্টমার ডেস্কে জমা হয়েছে। আমরা শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করব।"
                actionLabel="আরেকটি বার্তা দিন"
                onAction={() => {
                  setName('');
                  setPhone('');
                  setMessage('');
                  setFieldErrors({});
                  setError('');
                  setSubmitted(false);
                }}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-bold text-lg font-serifBangla text-gangchill-ink border-b border-gangchill-ink/10 pb-3">
                  সরাসরি বার্তা পাঠান
                </h2>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    {error}
                  </div>
                )}

                <FormField
                  label="আপনার নাম"
                  required
                  placeholder="নাম লিখুন"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  error={fieldErrors.name}
                />

                <FormField
                  label="মোবাইল নম্বর"
                  required
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  error={fieldErrors.phone}
                />

                <Textarea
                  label="আপনার জিজ্ঞাসা বা বার্তা"
                  required
                  placeholder="কোন মাছের বিষয়ে জানতে চান লিখুন..."
                  rows={4}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  error={fieldErrors.message}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={loading}
                >
                  বার্তা পাঠান
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};
