import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Phone,
  Mail,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Check,
  X,
  User,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { authService } from '../../../services/authService';
import { apiClient } from '../../../services/apiClient';
import { PlatformSettings, AdminUser } from '../../../types/admin';

// Helper to resize & compress uploaded avatar to safe localStorage base64 (max 256x256)
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > size) {
            height = Math.round((height * size) / width);
            width = size;
          }
        } else {
          if (height > size) {
            width = Math.round((width * size) / height);
            height = size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

interface FormErrors {
  defaultMoqKg?: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
}

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: '',
    tagline: '',
    supportPhone: '',
    supportEmail: '',
    emergencyHotline: '',
    businessHours: '',
    headOfficeAddress: '',
    hubLocations: '',
    defaultMoqKg: 50,
    coldChainEnabled: true,
    allowPublicSellerSubmissions: true,
    allowPublicInvestorInterest: true,
    maintenanceMode: false
  });

  const [adminProfile, setAdminProfile] = useState<AdminUser>(() => {
    return authService.getCurrentUser() || authService.getDefaultAdmin();
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    // Load persisted settings immediately
    const loaded = adminService.getSettings();
    if (loaded) {
      setSettings(loaded);
    }
    const currentAdmin = authService.getCurrentUser();
    if (currentAdmin) {
      setAdminProfile(currentAdmin);
    }
    setIsLoading(false);

    // Fetch fresh settings from server
    adminService.fetchSettings().then((fresh) => {
      if (fresh) {
        setSettings(fresh);
      }
    }).catch(console.error);
  }, []);

  const handleChange = <K extends keyof PlatformSettings>(field: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    // Clear specific field error on edit
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as keyof FormErrors];
        return copy;
      });
    }
  };

  const handleAdminChange = <K extends keyof AdminUser>(field: K, value: AdminUser[K]) => {
    setAdminProfile((prev) => ({ ...prev, [field]: value }));
    const errorKey: keyof FormErrors | undefined =
      field === 'name' ? 'adminName' : field === 'email' ? 'adminEmail' : field === 'phone' ? 'adminPhone' : undefined;
    if (errorKey && formErrors[errorKey]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('অনুগ্রহ করে একটি বৈধ ইমেজ ফাইল (PNG, JPG, WEBP) নির্বাচন করুন।');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির আকার সর্বোচ্চ ৫ মেগাবাইট পর্যন্ত হতে পারে।');
      return;
    }
    try {
      const uploadRes = await apiClient.upload(file);
      if (uploadRes.success && uploadRes.data?.url) {
        handleAdminChange('avatar', uploadRes.data.url);
      } else {
        const base64Data = await compressAndResizeImage(file);
        handleAdminChange('avatar', base64Data);
      }
    } catch {
      try {
        const base64Data = await compressAndResizeImage(file);
        handleAdminChange('avatar', base64Data);
      } catch {
        alert('ছবি আপলোড ও প্রসেস করতে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি চেষ্টা করুন।');
      }
    }
  };

  const handleRemoveAvatar = () => {
    handleAdminChange('avatar', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Instant functional toggle for Maintenance Mode
  const handleToggleMaintenanceMode = async (checked: boolean) => {
    setSettings((prev) => ({ ...prev, maintenanceMode: checked }));
    const updated = { ...settings, maintenanceMode: checked };
    await adminService.saveSettings(updated, adminProfile.name);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!settings.defaultMoqKg || Number(settings.defaultMoqKg) < 1) {
      errors.defaultMoqKg = 'ন্যূনতম অর্ডার পরিমাণ অন্তত ১ কেজি হতে হবে';
    }

    // Admin Profile Validation
    if (!adminProfile.name.trim()) {
      errors.adminName = 'অ্যাডমিনের নাম ফাঁকা রাখা যাবে না';
    } else if (adminProfile.name.trim().length < 2) {
      errors.adminName = 'অ্যাডমিনের নাম কমপক্ষে ২ অক্ষরের হতে হবে';
    }

    if (!adminProfile.email.trim()) {
      errors.adminEmail = 'অ্যাডমিন ইমেইল আবশ্যক';
    } else if (!emailRegex.test(adminProfile.email.trim())) {
      errors.adminEmail = 'সঠিক ইমেইল ফরম্যাট প্রদান করুন';
    }

    if (!adminProfile.phone?.trim()) {
      errors.adminPhone = 'অ্যাডমিন ফোন নম্বর আবশ্যক';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await adminService.saveSettings(settings, adminProfile.name);
      if (saved) {
        setSettings(saved);
      }
      authService.updateCurrentUser(adminProfile);
      setIsSaving(false);
      setSavedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        setSavedSuccess(false);
      }, 4000);
    } catch {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    const defaultAdmin = authService.getDefaultAdmin();
    const defaults = await adminService.resetSettings(defaultAdmin.name);
    authService.updateCurrentUser(defaultAdmin);
    setSettings(defaults);
    setAdminProfile(defaultAdmin);
    setFormErrors({});
    setShowResetConfirm(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">প্ল্যাটফর্ম সেটিংস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
          সিস্টেম ও প্ল্যাটফর্ম কনফিগারেশন
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="প্রাথমিক ডিফল্ট কনফিগারেশন ফিরিয়ে আনুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট রিসেট</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>পরিবর্তন সংরক্ষণ করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2.5 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">
              প্ল্যাটফর্মের সেটিংস সফলভাবে আপডেট এবং লোকাল স্টোরেজে স্থায়ীভাবে সংরক্ষিত হয়েছে!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Validation Error Banner */}
      {Object.keys(formErrors).length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <p className="font-semibold text-[11px] sm:text-xs">অনুগ্রহ করে নিচের লাল চিহ্নিত ভুলগুলো সংশোধন করে পুনরায় সংরক্ষণ করুন।</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
        {/* Section 1: Supply Chain & Operational Business Rules */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 space-y-3 sm:space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              ১. সাপ্লাই চেইন ও বিজনেস পলিসি
            </h2>
            <span className="text-[10px] sm:text-[11px] text-slate-400">অপারেশনাল নিয়মাবলী ও অটোমেশন</span>
          </div>

          <div className="space-y-3 sm:space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px] sm:text-xs">
                  ডিফল্ট ন্যূনতম ক্রয়াদেশ (MOQ - কেজি) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={settings.defaultMoqKg}
                  onChange={(e) => handleChange('defaultMoqKg', Number(e.target.value))}
                  className={`w-full px-3 py-1.5 sm:py-2 bg-slate-50 border rounded-lg sm:rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-hidden focus:bg-white transition-colors ${
                    formErrors.defaultMoqKg
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {formErrors.defaultMoqKg ? (
                  <p className="text-rose-600 text-[11px] mt-1 font-medium">{formErrors.defaultMoqKg}</p>
                ) : (
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    নতুন মাছের স্টক তৈরি করার সময় এই ভ্যালুটি স্বয়ংক্রিয়ভাবে ডিফল্ট হবে।
                  </span>
                )}
              </div>

              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">কোল্ড চেইন তাপমাত্রা ট্র্যাকিং</h4>
                  <p className="text-[11px] text-slate-500">রেফার ভ্যানের তাপমাত্রা ও বরফ প্যাকিং মনিটরিং সক্রিয় রাখা</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.coldChainEnabled}
                    onChange={(e) => handleChange('coldChainEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-0.5">
              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">ঘাট প্ল্যাটফর্ম সাবমিশন (/sell)</h4>
                  <p className="text-[11px] text-slate-500">ওয়েবসাইট থেকে জেলে ও খামারিদের সরাসরি লট প্রস্তাব জমা নেওয়া</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.allowPublicSellerSubmissions}
                    onChange={(e) => handleChange('allowPublicSellerSubmissions', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">বিনিয়োগ আবেদন মডিউল (/invest)</h4>
                  <p className="text-[11px] text-slate-500">মৎস্য তহবিল প্রকল্পে পাবলিক আবেদন ও প্লেজ গ্রহণ সক্রিয় রাখা</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.allowPublicInvestorInterest}
                    onChange={(e) => handleChange('allowPublicInvestorInterest', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Maintenance Mode Functional Control */}
            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
              settings.maintenanceMode
                ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-200 shadow-sm'
                : 'bg-slate-50 border-slate-200/90'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${settings.maintenanceMode ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
                    <h4 className={`font-bold text-xs sm:text-sm ${settings.maintenanceMode ? 'text-rose-950 font-serifBangla' : 'text-slate-800'}`}>
                      মেইনটেন্যান্স মোড (Maintenance Mode)
                    </h4>
                    {settings.maintenanceMode ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                        <span>🔴</span>
                        <span>Maintenance Mode</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                        <span>🟢</span>
                        <span>Active / Normal Mode</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed max-w-xl">
                    মেইনটেন্যান্স মোড সক্রিয় থাকলে সাধারণ ভিজিটরদের কাছে কেনা-বেচার লেনদেন বাটনসমূহ লাল ও লকড দেখাবে এবং এপিআই রিকোয়েস্ট ৫০৩ হিসেবে প্রত্যাখ্যাত হবে।
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleToggleMaintenanceMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>

              {/* Centralized Maintenance Message Configuration */}
              <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-700">
                  সেন্ট্রালাইজড রক্ষণাবেক্ষণ বার্তা (Maintenance Message):
                </label>
                <input
                  type="text"
                  value={settings.maintenanceMessage || ''}
                  placeholder="সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।"
                  onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-rose-500 transition-colors font-bangla"
                />
                <p className="text-[10px] text-slate-500">
                  মোড সক্রিয় থাকলে এই বার্তাটি ওয়েবসাইটের টপ ব্যানার এবং ব্যাকএন্ড এপিআই ৫০৩ রেসপন্সে প্রদর্শিত হবে।
                </p>
              </div>

              {settings.maintenanceMode && (
                <div className="mt-2.5 pt-2.5 border-t border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-rose-800 animate-fade-in">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block animate-pulse" />
                    মূল ওয়েবসাইটে সাধারণ ভিজিটরদের জন্য রক্ষণাবেক্ষণ সতর্কতা ও নোটিশ বার বর্তমানে লাইভ প্রদর্শিত হচ্ছে।
                  </span>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 underline shrink-0"
                  >
                    <span>পাবলিক সাইটে নোটিশ দেখুন</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: System Administrator Profile */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                ২. সিস্টেম অ্যাডমিন প্রোফাইল
              </h2>
              <span className="text-[10px] sm:text-[11px] text-slate-400">প্রশাসনিক প্রোফাইল ও যোগাযোগের তথ্য সম্পাদনা</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              একক অ্যাডমিন
            </span>
          </div>

          {/* Active Admin Live Summary Card */}
          <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {adminProfile.avatar ? (
                <img
                  src={adminProfile.avatar}
                  alt={adminProfile.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-300 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 font-mono">
                  {adminProfile.name?.includes('MD') ? 'MD' : (adminProfile.name?.slice(0, 2) || 'AD')}
                </div>
              )}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{adminProfile.name || 'MD Admin'}</h4>
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                    {adminProfile.designation || 'প্রধান অ্যাডমিনিস্ট্রেটর'}
                  </span>
                </div>
                <p className="text-slate-600 text-xs font-mono">
                  {adminProfile.email || 'admin@gangchill.com'} • {adminProfile.phone || '০১৭১২-৩৪৫৬৭৮'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400">গাংচিল প্ল্যাটফর্মের একমাত্র অনুমোদিত প্রশাসনিক নিয়ন্ত্রক অ্যাকাউন্ট</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                সক্রিয় সেশন
              </span>
            </div>
          </div>

          {/* Profile Edit Inputs */}
          <div className="space-y-3 sm:space-y-4 text-xs pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px] sm:text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  অ্যাডমিনের নাম (Full Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminProfile.name}
                  onChange={(e) => handleAdminChange('name', e.target.value)}
                  className={`w-full px-3 py-1.5 sm:py-2 bg-slate-50 border rounded-lg sm:rounded-xl text-slate-900 text-xs font-medium focus:outline-hidden focus:bg-white transition-colors ${
                    formErrors.adminName
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="যেমন: MD Admin"
                />
                {formErrors.adminName && (
                  <p className="text-rose-600 text-[11px] mt-1 font-medium">{formErrors.adminName}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px] sm:text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  পদবী ও ভূমিকা (Designation & Role) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminProfile.designation || ''}
                  onChange={(e) => handleAdminChange('designation', e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-slate-900 text-xs font-medium focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
                  placeholder="যেমন: ম্যানেজিং ডিরেক্টর ও চিফ অ্যাডমিন"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px] sm:text-xs flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  অফিশিয়াল অ্যাডমিন ইমেইল <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={adminProfile.email}
                  onChange={(e) => handleAdminChange('email', e.target.value)}
                  className={`w-full px-3 py-1.5 sm:py-2 bg-slate-50 border rounded-lg sm:rounded-xl text-slate-900 text-xs font-mono focus:outline-hidden focus:bg-white transition-colors ${
                    formErrors.adminEmail
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="admin@gangchill.com"
                />
                {formErrors.adminEmail && (
                  <p className="text-rose-600 text-[11px] mt-1 font-medium">{formErrors.adminEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px] sm:text-xs flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  ব্যক্তিগত / প্রশাসনিক ফোন নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminProfile.phone || ''}
                  onChange={(e) => handleAdminChange('phone', e.target.value)}
                  className={`w-full px-3 py-1.5 sm:py-2 bg-slate-50 border rounded-lg sm:rounded-xl text-slate-900 text-xs font-mono focus:outline-hidden focus:bg-white transition-colors ${
                    formErrors.adminPhone
                      ? 'border-rose-300 bg-rose-50/50 focus:border-rose-500'
                      : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="01712-345678"
                />
                {formErrors.adminPhone && (
                  <p className="text-rose-600 text-[11px] mt-1 font-medium">{formErrors.adminPhone}</p>
                )}
              </div>
            </div>

            {/* Avatar Photo Upload (Pure device upload, no URL input) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-[11px] sm:text-xs flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                প্রোফাইল ছবি / অবতার আপলোড (ঐচ্ছিক)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />

              <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {adminProfile.avatar ? (
                  <div className="relative group shrink-0">
                    <img
                      src={adminProfile.avatar}
                      alt={adminProfile.name}
                      className="w-14 h-14 rounded-xl object-cover border-2 border-blue-500 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                      title="ছবি মুছুন"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border-2 border-dashed border-blue-300 shrink-0 font-mono shadow-inner">
                    {adminProfile.name?.includes('MD') ? 'MD' : (adminProfile.name?.slice(0, 2) || 'AD')}
                  </div>
                )}

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{adminProfile.avatar ? 'নতুন ছবি পরিবর্তন করুন' : 'ডিভাইস থেকে ছবি আপলোড করুন'}</span>
                    </button>

                    {adminProfile.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg sm:rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ছবি মুছুন</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                    সরাসরি আপনার কম্পিউটার বা ফোন থেকে ছবি আপলোড করুন (JPG, PNG, WEBP — সর্বোচ্চ ৫MB)। স্বয়ংক্রিয়ভাবে প্রফেশনাল স্কয়ার অবতারে রূপান্তর হবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-2 sm:gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
          >
            বাতিল / রিসেট
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>সংরক্ষণ করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>সেটিংস পরিবর্তন নিশ্চিত করুন</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal for Reset Defaults */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4 animate-scale-up">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">ডিফল্ট সেটিংস ফিরিয়ে আনতে চান?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                এটি প্ল্যাটফর্মের সমস্ত কাস্টম কনফিগারেশন মুছে ফেলে প্রাথমিক স্ট্যান্ডার্ড ডিফল্ট মানে রিসেট করবে। আপনি কি নিশ্চিত?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                হ্যাঁ, রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
