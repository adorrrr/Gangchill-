import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  Plus,
  Search,
  ExternalLink,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  Phone,
  Mail
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { InvestmentOpportunity, InvestmentStatus } from '../../../types/investment';
import { InvestorInterest } from '../../../types/forms';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { ImageUploader, ImagePreset } from '../../../components/admin/ImageUploader';

const PRESET_INVESTMENT_IMAGES: ImagePreset[] = [
  { label: 'চাঁদপুর ইলিশ সংগ্রহ', url: '/hero-fishermen-boat.png' },
  { label: 'চলনবিল পাবদা প্রকল্প', url: '/chalanbeel-pabda.jpg' },
  { label: 'নাজিরারটেক শুঁটকি প্রকল্প', url: '/nazirartek-shutki.jpg' }
];

export const AdminInvestmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'interests'>('campaigns');
  const [campaigns, setCampaigns] = useState<InvestmentOpportunity[]>([]);
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvestmentStatus>('all');

  // Modal states
  const [editingCampaign, setEditingCampaign] = useState<InvestmentOpportunity | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteInterestId, setDeleteInterestId] = useState<string | null>(null);

  // Form state for new / edit campaign
  const [formData, setFormData] = useState({
    title: '',
    category: 'ইলিশ সংগ্রহ',
    location: 'চাঁদপুর বড়স্টেশন',
    requiredCapital: 500000,
    minimumInvestment: 25000,
    profitPercentage: 14,
    durationDays: 120,
    targetQuantity: 1000,
    unit: 'কেজি (KG)',
    description: '',
    sourceRegion: 'চাঁদপুর মোহনা ঘাট',
    targetBuyers: 'ঢাকা ও চট্টগ্রামের প্রিমিয়াম সুপারশপ',
    status: 'open' as InvestmentStatus,
    image: '/hero-fishermen-boat.png'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [invs, fetchedInterests] = await Promise.all([
        adminService.fetchInvestments(),
        adminService.fetchInvestorInterests()
      ]);
      setCampaigns(invs);
      setInterests(fetchedInterests);
    } catch {
      setCampaigns(adminService.getInvestments());
      setInterests(adminService.getInvestorInterests());
    }
  };

  const handleUpdateInterestStatus = async (interestId: string, newStatus: string) => {
    try {
      await adminService.updateInvestorInterestStatus(interestId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('gangchill_investments_updated', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      window.removeEventListener('gangchill_investments_updated', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  // Summary Metrics
  const totalTargetCapital = campaigns.reduce((acc, c) => acc + c.requiredCapital, 0);
  const totalRaisedCapital = campaigns.reduce((acc, c) => acc + c.raisedCapital, 0);
  const totalPledgesAmount = interests.reduce((acc, i) => acc + i.interestedAmount, 0);
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'open').length;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered interests
  const filteredInterests = interests.filter((i) => {
    return (
      i.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.phone.includes(searchTerm) ||
      i.opportunityTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenEdit = (campaign: InvestmentOpportunity) => {
    setEditingCampaign(campaign);
    const primaryImg = (campaign.images && campaign.images[0]) || (campaign as any).image || '/hero-fishermen-boat.png';
    setFormData({
      title: campaign.title,
      category: campaign.category,
      location: campaign.location,
      requiredCapital: campaign.requiredCapital,
      minimumInvestment: campaign.minimumInvestment,
      profitPercentage: campaign.profitPercentage,
      durationDays: campaign.durationDays,
      targetQuantity: campaign.procurementPlan?.targetQuantity || 1000,
      unit: campaign.procurementPlan?.unit || 'কেজি (KG)',
      description: campaign.description,
      sourceRegion: campaign.procurementPlan?.sourceRegion || '',
      targetBuyers: campaign.procurementPlan?.targetBuyers || '',
      status: campaign.status,
      image: primaryImg
    });
    setIsNewModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingCampaign(null);
    setFormData({
      title: '',
      category: 'ইলিশ সংগ্রহ',
      location: 'চাঁদপুর বড়স্টেশন',
      requiredCapital: 500000,
      minimumInvestment: 25000,
      profitPercentage: 14,
      durationDays: 120,
      targetQuantity: 1000,
      unit: 'কেজি (KG)',
      description: '',
      sourceRegion: 'চাঁদপুর মোহনা ঘাট',
      targetBuyers: 'ঢাকা ও চট্টগ্রামের প্রিমিয়াম সুপারশপ',
      status: 'open',
      image: '/hero-fishermen-boat.png'
    });
    setIsNewModalOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSaving(true);
    setSaveError(null);

    const campaignImage = formData.image ? formData.image.trim() : '/hero-fishermen-boat.png';
    const imagesList = [campaignImage];

    try {
      if (editingCampaign) {
        await adminService.updateInvestment(editingCampaign.id, {
          title: formData.title,
          category: formData.category,
          location: formData.location,
          requiredCapital: Number(formData.requiredCapital),
          minimumInvestment: Number(formData.minimumInvestment),
          profitPercentage: Number(formData.profitPercentage),
          durationDays: Number(formData.durationDays),
          description: formData.description,
          status: formData.status,
          images: imagesList,
          procurementPlan: {
            ...editingCampaign.procurementPlan,
            targetQuantity: Number(formData.targetQuantity),
            unit: formData.unit,
            sourceRegion: formData.sourceRegion,
            targetBuyers: formData.targetBuyers
          }
        });
      } else {
        const slug = formData.title
          .toLowerCase()
          .replace(/[^a-z0-9\u0980-\u09ff]+/g, '-')
          .replace(/(^-|-$)/g, '') || `campaign-${Date.now()}`;

        const newOpportunity: InvestmentOpportunity = {
          id: `fund-${Date.now()}`,
          slug,
          title: formData.title,
          productName: formData.category,
          category: formData.category,
          location: formData.location,
          requiredCapital: Number(formData.requiredCapital),
          raisedCapital: 0,
          minimumInvestment: Number(formData.minimumInvestment),
          profitPercentage: Number(formData.profitPercentage),
          durationDays: Number(formData.durationDays),
          status: formData.status,
          description: formData.description,
          investorCount: 0,
          procurementPlan: {
            targetQuantity: Number(formData.targetQuantity),
            unit: formData.unit,
            sourceRegion: formData.sourceRegion,
            targetBuyers: formData.targetBuyers,
            purchaseWindow: 'চলতি মৌসুম',
            salesWindow: 'সুপারশপ ও ইনস্টিটিউশনাল বায়ার'
          },
          timeline: [
            { stage: 1, title: 'তহবিল সংগ্রহ ও চুক্তি স্বাক্ষর', duration: '১৫ দিন', description: 'বিনিয়োগকারীদের সাথে আইনগত চুক্তি সম্পন্নকরণ', status: 'active' },
            { stage: 2, title: 'ঘাটে সরাসরি বাল্ক ক্রয়', duration: '২০ দিন', description: 'নির্বাচিত ঘাট থেকে নির্ধারিত গ্রেডে মাছ কেনা', status: 'pending' },
            { stage: 3, title: 'কোল্ড চেইন সরবরাহ ও বিক্রয়', duration: '৬০ দিন', description: 'রেফার ভ্যানে ঢাকায় ডেলিভারি ও বিল গ্রহণ', status: 'pending' },
            { stage: 4, title: 'মুনাফাসহ মূলধন ফেরত', duration: '১০ দিন', description: 'বিনিয়োগকারীদের একাউন্টে তহবিল ও লভ্যাংশ বণ্টন', status: 'pending' }
          ],
          images: imagesList
        };
        await adminService.createInvestment(newOpportunity);
      }

      setIsNewModalOpen(false);
      await loadData();
    } catch (err: any) {
      setSaveError(err?.message || 'প্রকল্প সংরক্ষণ করা সম্ভব হয়নি।');
      alert(err?.message || 'প্রকল্প সংরক্ষণ করা সম্ভব হয়নি।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, current: InvestmentStatus) => {
    const next: InvestmentStatus = current === 'open' ? 'funded' : current === 'funded' ? 'closed' : 'open';
    try {
      await adminService.updateInvestmentStatus(id, next);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
    }
  };

  const handleDeleteCampaign = async () => {
    if (deleteTargetId) {
      try {
        await adminService.deleteInvestment(deleteTargetId);
        setDeleteTargetId(null);
        await loadData();
      } catch (err: any) {
        alert(err?.message || 'প্রকল্প ডিলিট করা ব্যর্থ হয়েছে।');
      }
    }
  };

  const handleDeleteInterest = async () => {
    if (deleteInterestId) {
      try {
        await adminService.deleteInvestorInterest(deleteInterestId);
        setDeleteInterestId(null);
        await loadData();
      } catch (err: any) {
        alert(err?.message || 'আবেদন মুছে ফেলা সম্ভব হয়নি।');
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        <div className="text-xs text-slate-500 font-medium">
          চলমান ক্যাম্পেইন ও বিনিয়োগ আবেদন
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>নতুন প্রকল্প শুরু করুন</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">মোট লক্ষ্যমাত্রা</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">৳{(totalTargetCapital / 100000).toFixed(1)} লাখ</p>
          <span className="text-[10px] sm:text-[11px] text-slate-400">সকল ক্যাম্পেইন মিলিয়ে</span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">সংগৃহীত তহবিল</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">৳{(totalRaisedCapital / 100000).toFixed(1)} লাখ</p>
          <span className="text-[10px] sm:text-[11px] text-slate-400">
            {totalTargetCapital > 0 ? Math.round((totalRaisedCapital / totalTargetCapital) * 100) : 0}% তহবিল সম্পন্ন
          </span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">বিনিয়োগ আবেদন</span>
            <Users className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-700 mt-1">৳{(totalPledgesAmount / 100000).toFixed(1)} লাখ</p>
          <span className="text-[10px] sm:text-[11px] text-slate-400">{interests.length} টি আবেদন</span>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">সক্রিয় তহবিল</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{activeCampaignsCount} টি</p>
          <span className="text-[10px] sm:text-[11px] text-slate-400">চলমান প্রকল্প</span>
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'campaigns'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            তহবিল প্রকল্পসমূহ ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'interests'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            আবেদন ({interests.length})
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] md:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'campaigns' ? 'প্রকল্প বা স্থান খুঁজুন...' : 'বিনিয়োগকারীর নাম বা ফোন...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {activeTab === 'campaigns' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="open">উন্মুক্ত (Open)</option>
              <option value="funded">ফান্ডেড (Funded)</option>
              <option value="closed">সম্পন্ন (Closed)</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Campaigns List */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredCampaigns.map((camp) => {
            const percentage = Math.min(100, Math.round((camp.raisedCapital / camp.requiredCapital) * 100));
            return (
              <div
                key={camp.id}
                className="rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs transition-all flex flex-col overflow-hidden group"
              >
                {/* Visual Banner */}
                <div className="relative aspect-[16/8] bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={(camp.images && camp.images[0]) || (camp as any).image || '/hero-fishermen-boat.png'}
                    alt={camp.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/hero-fishermen-boat.png';
                    }}
                  />
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5 pointer-events-none">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/70 text-white backdrop-blur-xs border border-white/20">
                      {camp.category}
                    </span>
                    <span className="text-[10px] text-white/95 bg-slate-900/70 px-2 py-0.5 rounded backdrop-blur-xs border border-white/20">
                      {camp.location}
                    </span>
                  </div>
                </div>

                {/* Header info */}
                <div className="p-3.5 sm:p-4 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {camp.id}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(camp.id, camp.status)}
                      title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                      className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all border ${
                        camp.status === 'open'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : camp.status === 'funded'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {camp.status === 'open' ? 'উন্মুক্ত (Open)' : camp.status === 'funded' ? 'পূর্ণ (Funded)' : 'সমাপ্ত (Closed)'}
                    </button>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serifBangla group-hover:text-blue-600 transition-colors line-clamp-2">
                    {camp.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">{camp.description}</p>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        প্রত্যাশিত মুনাফা
                      </span>
                      <p className="font-bold text-blue-700 mt-0.5 text-xs sm:text-sm">{camp.profitPercentage}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        মেয়াদকাল
                      </span>
                      <p className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">{camp.durationDays} দিন</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">ন্যূনতম বিনিয়োগ</span>
                      <p className="font-semibold text-slate-900 mt-0.5">৳{camp.minimumInvestment.toLocaleString('bn-BD')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">টার্গেট ভলিউম</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {camp.procurementPlan?.targetQuantity} {camp.procurementPlan?.unit}
                      </p>
                    </div>
                  </div>

                  {/* Funding Progress Bar */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        সংগ্রহ: <span className="text-slate-900 font-medium">৳{(camp.raisedCapital / 1000).toFixed(0)}k</span>
                      </span>
                      <span className="text-slate-500">
                        লক্ষ্য: <span className="text-slate-700">৳{(camp.requiredCapital / 1000).toFixed(0)}k</span>
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 100 ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{camp.investorCount || 0} জন যুক্ত</span>
                      <span className="font-bold text-blue-600">{percentage}% পূরণ</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <Link
                    to={`/invest/${camp.slug}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium text-[11px] sm:text-xs"
                  >
                    লাইভ প্রিভিউ
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(camp)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="প্রকল্প এডিট করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(camp.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="প্রকল্প মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200/80">
              <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">কোনো তহবিল প্রকল্প খুঁজে পাওয়া যায়নি</p>
              <button
                onClick={handleOpenNew}
                className="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3 h-3" />
                নতুন প্রকল্প যোগ করতে ক্লিক করুন
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Investor Interests Table */}
      {activeTab === 'interests' && (
        <div className="rounded-xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">বিনিয়োগকারীর নাম ও যোগাযোগ</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">আগ্রহী প্রকল্প</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">প্রস্তাবিত তহবিল (৳)</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">আগ্রহের তারিখ</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">বর্তমান অবস্থা</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">মন্তব্য ও নোট</th>
                  <th className="py-2.5 sm:py-3 px-3 sm:px-4 font-semibold text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInterests.map((interest) => (
                  <tr key={interest.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{interest.investorName}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <a
                          href={`tel:${interest.phone}`}
                          className="font-mono font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/80 text-[11px]"
                          title="সরাসরি কল করুন"
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{interest.phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/88${interest.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-semibold transition-colors"
                          title="WhatsApp-এ মেসেজ দিন"
                        >
                          WhatsApp
                        </a>
                      </div>
                      {interest.email && (
                        <div className="text-slate-500 text-[11px] mt-1 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <a href={`mailto:${interest.email}`} className="hover:underline hover:text-blue-600">
                            {interest.email}
                          </a>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <span className="font-medium text-slate-800 line-clamp-1">
                        {interest.opportunityTitle}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {interest.opportunityId}</span>
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
                        ৳{interest.interestedAmount?.toLocaleString('bn-BD')}
                      </div>
                      {interest.expectedProfit && (
                        <div className="text-[10px] sm:text-[11px] text-emerald-700 font-medium font-mono">
                          লব্ধ মুনাফা: ৳{interest.expectedProfit.toLocaleString('bn-BD')}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-slate-500 text-[11px]">
                      {interest.createdAt ? new Date(interest.createdAt).toLocaleDateString('bn-BD') : 'সম্প্রতি'}
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <select
                        value={interest.status || 'pending'}
                        onChange={(e) => handleUpdateInterestStatus(interest.id, e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none transition-colors ${
                          interest.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : interest.status === 'contacted'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : interest.status === 'reviewed'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : interest.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="pending">অপেক্ষমাণ (Pending)</option>
                        <option value="contacted">যোগাযোগ সম্পন্ন (Contacted)</option>
                        <option value="reviewed">পর্যালোচিত (Reviewed)</option>
                        <option value="approved">অনুমোদিত (Approved)</option>
                        <option value="rejected">বাতিল (Rejected)</option>
                      </select>
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 max-w-xs">
                      <p className="text-slate-600 line-clamp-2 text-[11px]">
                        {interest.notes || <span className="text-slate-400 italic">কোনো অতিরিক্ত নোট নেই</span>}
                      </p>
                    </td>

                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDeleteInterestId(interest.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="আবেদন মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredInterests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      কোনো বিনিয়োগ আবেদনের তথ্য নেই
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Opportunity */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl md:max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl p-4 sm:p-5 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serifBangla flex items-center gap-2">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                {editingCampaign ? 'তহবিল প্রকল্প এডিট করুন' : 'নতুন তহবিল প্রকল্প তৈরি'}
              </h2>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-3.5 pt-3 text-xs">
              {saveError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {saveError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                <div className="col-span-full">
                  <label className="block text-slate-700 font-medium mb-1">প্রকল্পের শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="যেমন: পদ্মার রূপালী ইলিশ সংগ্রহ তহবিল ২০২৬"
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ক্যাটাগরি</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="ইলিশ সংগ্রহ">ইলিশ সংগ্রহ</option>
                    <option value="চিংড়ি প্রসেসিং">চিংড়ি প্রসেসিং</option>
                    <option value="সামুদ্রিক মাছ">সামুদ্রিক মাছ</option>
                    <option value="মিঠাপানির মাছ">মিঠাপানির মাছ</option>
                    <option value="প্রাকৃতিক শুঁটকি">প্রাকৃতিক শুঁটকি</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">সংগ্রহ অঞ্চল / ঘাট</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="যেমন: চাঁদপুর বড়স্টেশন মোহনা ঘাট"
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">প্রয়োজনীয় তহবিল (৳) *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={formData.requiredCapital}
                    onChange={(e) => setFormData({ ...formData, requiredCapital: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ন্যূনতম বিনিয়োগ ইউনিট (৳) *</label>
                  <input
                    type="number"
                    required
                    min={5000}
                    step={5000}
                    value={formData.minimumInvestment}
                    onChange={(e) => setFormData({ ...formData, minimumInvestment: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">প্রত্যাশিত লাভ (%) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    step={0.5}
                    value={formData.profitPercentage}
                    onChange={(e) => setFormData({ ...formData, profitPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">মেয়াদকাল (দিন) *</label>
                  <input
                    type="number"
                    required
                    min={30}
                    max={365}
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">টার্গেট কোয়ান্টিটি (কেজি)</label>
                  <input
                    type="number"
                    value={formData.targetQuantity}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">প্রকল্পের বর্তমান স্ট্যাটাস</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InvestmentStatus })}
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="open">উন্মুক্ত (Open - বিনিয়োগ গ্রহণ চলছে)</option>
                    <option value="funded">পূর্ণ (Funded - টার্গেট সম্পন্ন)</option>
                    <option value="closed">সমাপ্ত (Closed - লভ্যাংশ বণ্টন সম্পন্ন)</option>
                  </select>
                </div>

                <div className="col-span-full">
                  <ImageUploader
                    multiple={false}
                    value={formData.image}
                    onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                    presets={PRESET_INVESTMENT_IMAGES}
                    label="প্রকল্পের ব্যানার ছবি (Image Upload)"
                    helperText="JPG, PNG বা WEBP ফরম্যাটে সর্বোচ্চ ৫MB। সরাসরি ডিভাইস থেকে আপলোড করতে পারেন অথবা ডিফল্ট ছবি নির্বাচন করতে পারেন।"
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-slate-700 font-medium mb-1">প্রকল্পের বিস্তারিত বিবরণ</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="ঘাট সংগ্রহ পরিকল্পনা, কোয়ালিটি কন্ট্রোল ও ডেলিভারি চ্যানেলের সংক্ষিপ্ত পরিচিতি..."
                    className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold shadow-xs cursor-pointer transition-colors text-xs"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : (editingCampaign ? 'আপডেট সংরক্ষণ করুন' : 'প্রকল্প প্রকাশ করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campaign Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="তহবিল প্রকল্প মুছে ফেলতে চান?"
        message="এই তহবিল প্রকল্পটি প্ল্যাটফর্ম থেকে স্থায়ীভাবে মুছে ফেলা হবে। এই পদক্ষেপটি ফিরিয়ে আনা সম্ভব নয়।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        variant="danger"
        onConfirm={handleDeleteCampaign}
        onClose={() => setDeleteTargetId(null)}
      />

      {/* Delete Interest Confirmation */}
      <ConfirmModal
        isOpen={!!deleteInterestId}
        title="বিনিয়োগ আবেদন বাতিল করতে চান?"
        message="এই বিনিয়োগকারীর আগ্রহের রেকর্ডটি তালিকা থেকে অপসারণ করা হবে।"
        confirmLabel="হ্যাঁ, অপসারণ করুন"
        variant="danger"
        onConfirm={handleDeleteInterest}
        onClose={() => setDeleteInterestId(null)}
      />
    </div>
  );
};
