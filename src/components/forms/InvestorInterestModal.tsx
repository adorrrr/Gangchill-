import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { FormField } from './FormField';
import { Textarea } from './Textarea';
import { Button } from '../common/Button';
import { SuccessState } from '../common/SuccessState';
import { submissionService } from '../../services/submissionService';
import { adminService } from '../../services/adminService';
import { InvestmentOpportunity } from '../../types/investment';
import { formatTaka, toBanglaDigits, formatDays, normalizeBanglaToEnglishDigits } from '../../utils/formatters';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface InvestorInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: InvestmentOpportunity;
}

export const InvestorInterestModal: React.FC<InvestorInterestModalProps> = ({
  isOpen,
  onClose,
  opportunity
}) => {
  const [platformSettings, setPlatformSettings] = useState(() => adminService.getSettings());
  const [investorName, setInvestorName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState(opportunity.minimumInvestment.toString());
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);

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

  // Re-sync the pre-filled amount whenever the underlying opportunity changes.
  // Without this, navigating client-side from one investment's detail page to
  // another (without a full page reload) left this modal showing the
  // previous opportunity's minimum investment amount.
  useEffect(() => {
    setAmount(opportunity.minimumInvestment.toString());
    setErrors({});
  }, [opportunity.id, opportunity.minimumInvestment]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetAndClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const numericAmount = Number(amount) || 0;
  const expectedProfit = Math.round((numericAmount * opportunity.profitPercentage) / 100);
  const totalReturn = numericAmount + expectedProfit;
  const remainingCapital = opportunity.requiredCapital - opportunity.raisedCapital;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!investorName.trim()) errs.investorName = 'আপনার পূর্ণ নাম লিখুন';
    const normalizedPhone = normalizeBanglaToEnglishDigits(phone.replace(/[\s-]/g, ''));
    if (!phone.trim()) {
      errs.phone = 'মোবাইল নম্বর প্রদান করুন';
    } else if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      errs.phone = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)';
    }

    if (!numericAmount || numericAmount < opportunity.minimumInvestment) {
      errs.amount = `সর্বনিম্ন অংশগ্রহণ সীমা ${formatTaka(opportunity.minimumInvestment)}`;
    } else if (remainingCapital <= 0) {
      errs.amount = 'এই প্রকল্পের তহবিল ইতিমধ্যে সম্পূর্ণ সংগৃহীত হয়েছে, নতুন বিনিয়োগ গ্রহণ সম্ভব নয়';
    } else if (numericAmount > remainingCapital) {
      errs.amount = `অবশিষ্ট প্রয়োজনীয় মূলধন ${formatTaka(remainingCapital)}-এর বেশি গ্রহণ সম্ভব নয়`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaintenanceMode) {
      setErrors({ form: 'বর্তমানে আমাদের ওয়েবসাইটে সাময়িক রক্ষণাবেক্ষণের কাজ চলছে। নতুন বিনিয়োগ আবেদন সাময়িকভাবে স্থগিত।' });
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await submissionService.submitInvestorInterest({
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        investorName,
        phone,
        email: email.trim() || undefined,
        interestedAmount: numericAmount,
        expectedProfit,
        notes: notes.trim() || undefined
      });

      if (res.success) {
        setSubmittedId(res.interestId);
      } else {
        setErrors({ form: res.message || 'বিনিয়োগ আবেদন পাঠাতে সমস্যা হয়েছে।' });
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'সার্ভার সংযোগে ত্রুটি।' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedId(null);
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="investor-interest-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in text-gangchill-ink"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white border border-gangchill-ink/10 rounded-2xl sm:rounded-3xl overflow-hidden my-auto max-h-[calc(100vh-1.25rem)] max-h-[calc(100dvh-1.25rem)] sm:max-h-[88dvh] flex flex-col shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-gangchill-canvas via-white to-gangchill-canvas/50 border-b border-gangchill-ink/10 flex items-center justify-between shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <h3
              id="investor-interest-modal-title"
              className="font-bold text-lg sm:text-xl font-serifBangla text-gangchill-ink leading-snug"
            >
              এই সংগ্রহে অংশ নিতে চান?
            </h3>
            <p className="text-xs text-gangchill-ink/60 mt-0.5 truncate leading-normal">
              {opportunity.title}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gangchill-ink/60 hover:text-gangchill-ink hover:bg-black/5 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 pb-6 sm:pb-8 overflow-y-auto overscroll-contain flex-1 min-h-0 scroll-py-3">
          {submittedId ? (
            <SuccessState
              title="আগ্রহপত্র সফলভাবে গৃহীত হয়েছে!"
              message="আপনার অংশ নেওয়ার আগ্রহ নথিভুক্ত হয়েছে। এই মাছ সংগ্রহ প্রকল্পের এগ্রিমেন্ট ও ব্যাংকিং নির্দেশনাসহ Gangchill ইনভেস্টমেন্ট ডেস্ক থেকে যোগাযোগ করা হবে।"
              referenceId={submittedId}
              actionLabel="ঠিক আছে"
              onAction={handleResetAndClose}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {isMaintenanceMode && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center gap-2.5 shadow-xs animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <strong className="font-bold text-rose-900 block sm:inline mr-1">
                      🔧 সাময়িক রক্ষণাবেক্ষণ চলছে:
                    </strong>
                    <span>বর্তমানে আমাদের ওয়েবসাইটে সাময়িক রক্ষণাবেক্ষণের কাজ চলছে। নতুন বিনিয়োগ আবেদন সাময়িকভাবে স্থগিত।</span>
                  </div>
                </div>
              )}

              {errors.form && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {errors.form}
                </div>
              )}
              {/* Project summary card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gangchill-canvas/80 border border-gangchill-ink/8 text-xs sm:text-sm space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-gangchill-ink/60">প্রস্তাবিত লাভ (Profit Share):</span>
                  <span className="font-bold text-gangchill-blue">
                    {toBanglaDigits(opportunity.profitPercentage)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gangchill-ink/60">অর্থায়ন মেয়াদকাল:</span>
                  <span className="font-semibold text-gangchill-ink">
                    {formatDays(opportunity.durationDays)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gangchill-ink/60">সর্বনিম্ন অংশ:</span>
                  <span className="font-semibold text-gangchill-ink">
                    {formatTaka(opportunity.minimumInvestment)}
                  </span>
                </div>
              </div>

              <FormField
                label="আপনার পূর্ণ নাম"
                required
                placeholder="যেমন: মো: কামরুল হাসান"
                value={investorName}
                onChange={(e) => setInvestorName(e.target.value)}
                error={errors.investorName}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField
                  label="মোবাইল নম্বর"
                  required
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                />
                <FormField
                  label="ইমেইল (ঐচ্ছিক)"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <FormField
                label="কত টাকা বিনিয়োগ করতে চান? (৳)"
                required
                type="number"
                step="5000"
                min={opportunity.minimumInvestment}
                placeholder="যেমন: ৫০,০০০"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={errors.amount}
                helperText={`সর্বনিম্ন অংশ: ${formatTaka(opportunity.minimumInvestment)}`}
              />

              {/* Real-time Calculation */}
              {numericAmount >= opportunity.minimumInvestment && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-gangchill-gold/10 border border-gangchill-gold/30 text-xs sm:text-sm space-y-2">
                  <div className="flex justify-between items-center text-gangchill-ink/70">
                    <span>আপনার মূলধন:</span>
                    <span className="font-semibold text-gangchill-ink">{formatTaka(numericAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gangchill-blue">
                    <span>প্রত্যাশিত লাভ ({toBanglaDigits(opportunity.profitPercentage)}%):</span>
                    <span className="font-bold">+{formatTaka(expectedProfit)}</span>
                  </div>
                  <div className="pt-2 border-t border-gangchill-blue/20 flex justify-between items-center font-bold text-gangchill-ink">
                    <span>মেয়াদান্তে মোট সম্ভাব্য ফেরত:</span>
                    <span className="text-gangchill-blue text-base sm:text-lg">{formatTaka(totalReturn)}</span>
                  </div>
                </div>
              )}

              <Textarea
                label="অতিরিক্ত কোনো জিজ্ঞাসা বা মন্তব্য (ঐচ্ছিক)"
                placeholder="আপনার কোনো প্রশ্ন থাকলে লিখুন..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gangchill-ink/60 bg-gangchill-surface/50 p-2.5 rounded-lg border border-gangchill-ink/6">
                <ShieldCheck className="w-4 h-4 text-gangchill-blue shrink-0" />
                <span>Phase 1-এ কোনো অনলাইন পেমেন্ট নেই; এটি প্রাথমিক আগ্রহপত্র।</span>
              </div>

              <div className="pt-4 mt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-gangchill-ink/10">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleResetAndClose}
                  className="w-full sm:w-auto"
                >
                  বাতিল
                </Button>
                <Button
                  type="submit"
                  variant={isMaintenanceMode ? 'secondary' : 'gold'}
                  size="md"
                  disabled={loading || isMaintenanceMode}
                  loading={loading}
                  className={`w-full sm:w-auto ${isMaintenanceMode ? 'cursor-not-allowed opacity-80 bg-rose-600 hover:bg-rose-600 text-white border-rose-700' : ''}`}
                >
                  {isMaintenanceMode ? '🔒 আবেদন সাময়িকভাবে স্থগিত' : 'আগ্রহ জমা দিন'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
