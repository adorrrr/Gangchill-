import { Stock, StockStatus } from '../types/stock';
import { MOCK_STOCKS } from '../data/stocks';
import { MOCK_INVESTMENTS } from '../data/investments';
import { MOCK_BLOG_POSTS } from '../data/blog';
import { BlogPost } from '../types/blog';
import { InvestmentOpportunity } from '../types/investment';
import {
  BuyerOrder,
  SellerLot,
  DashboardMetrics,
  ActivityLogItem,
  PlatformSettings,
  OrderStatus,
  CustomerProfile,
  SupplierProfile
} from '../types/admin';
import { InvestorInterest } from '../types/forms';
import { apiClient } from './apiClient';

const ADMIN_STOCKS_KEY = 'gangchill_admin_stocks';
const ADMIN_ORDERS_KEY = 'gangchill_admin_orders';
const ADMIN_SELLER_LOTS_KEY = 'gangchill_admin_seller_lots';
const ADMIN_INVESTMENTS_KEY = 'gangchill_admin_investments';
const ADMIN_BLOG_KEY = 'gangchill_admin_blog';
const ADMIN_ACTIVITY_KEY = 'gangchill_admin_activity';
const ADMIN_SETTINGS_KEY = 'gangchill_admin_settings';
const ADMIN_CUSTOMERS_KEY = 'gangchill_admin_customers';
const ADMIN_SUPPLIERS_KEY = 'gangchill_admin_suppliers';
const INVESTOR_INTERESTS_KEY = 'gangchil_investor_interests';

// Default initial settings
const INITIAL_SETTINGS: PlatformSettings = {
  platformName: 'Gangchill B2B Hub',
  tagline: 'জাতীয় সামুদ্রিক ও নদীর মাছের পাইকারি সরবরাহ নেটওয়ার্ক',
  supportEmail: 'supply@gangchill.com',
  supportPhone: '+880 1712-345678',
  emergencyHotline: '+880 1712-345678',

  businessHours: 'শনিবার - বৃহস্পতিবার: সকাল ৮টা - রাত ১০টা',
  headOfficeAddress: 'হাউস ১২, রোড ৯, ব্লক-সি, গুলশান-১, ঢাকা ১২১২, বাংলাদেশ',
  hubLocations: 'চাঁদপুর বড়স্টেশন, কক্সবাজার ফিশারি ঘাট, খুলনা রূপসা, নাটোর চলনবিল, ভৈরব মেঘনা ঘাট',
  defaultMoqKg: 50,
  coldChainEnabled: true,
  allowPublicSellerSubmissions: true,
  allowPublicInvestorInterest: true,
  maintenanceMode: false,
  maintenanceMessage: 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।',
  notifyOnNewOrder: true,
  notifyOnNewLot: true,
  notifyOnNewInvestmentInterest: true
};

export const adminService = {
  // -------------------------------------------------------------
  // INITIALIZATION & SERVER SYNC
  // -------------------------------------------------------------
  async syncAll(): Promise<void> {
    try {
      const [
        stocksRes,
        ordersRes,
        lotsRes,
        invsRes,
        interestsRes,
        blogsRes,
        custsRes,
        supsRes,
        settingsRes,
        actRes
      ] = await Promise.allSettled([
        apiClient.get<Stock[]>('/stocks'),
        apiClient.get<BuyerOrder[]>('/orders'),
        apiClient.get<SellerLot[]>('/submissions/seller-lots'),
        apiClient.get<InvestmentOpportunity[]>('/investments'),
        apiClient.get<InvestorInterest[]>('/submissions/investor-interests'),
        apiClient.get<BlogPost[]>('/blog'),
        apiClient.get<CustomerProfile[]>('/customers'),
        apiClient.get<SupplierProfile[]>('/suppliers'),
        apiClient.get<PlatformSettings>('/settings'),
        apiClient.get<ActivityLogItem[]>('/dashboard/activity')
      ]);

      if (stocksRes.status === 'fulfilled' && stocksRes.value.success && stocksRes.value.data) {
        this.saveStocks(stocksRes.value.data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.success && ordersRes.value.data) {
        this.saveBuyerOrders(ordersRes.value.data);
      }
      if (lotsRes.status === 'fulfilled' && lotsRes.value.success && lotsRes.value.data) {
        this.saveSellerLots(lotsRes.value.data);
      }
      if (invsRes.status === 'fulfilled' && invsRes.value.success && invsRes.value.data) {
        this.saveInvestments(invsRes.value.data);
      }
      if (interestsRes.status === 'fulfilled' && interestsRes.value.success && interestsRes.value.data) {
        this.saveInvestorInterests(interestsRes.value.data);
      }
      if (blogsRes.status === 'fulfilled' && blogsRes.value.success && blogsRes.value.data) {
        this.saveBlogPosts(blogsRes.value.data);
      }
      if (custsRes.status === 'fulfilled' && custsRes.value.success && custsRes.value.data) {
        this.saveCustomers(custsRes.value.data);
      }
      if (supsRes.status === 'fulfilled' && supsRes.value.success && supsRes.value.data) {
        this.saveSuppliers(supsRes.value.data);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.success && settingsRes.value.data) {
        localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settingsRes.value.data));
      }
      if (actRes.status === 'fulfilled' && actRes.value.success && actRes.value.data) {
        localStorage.setItem(ADMIN_ACTIVITY_KEY, JSON.stringify(actRes.value.data));
      }
    } catch (err) {
      console.warn('Background sync error:', err);
    }
  },

  // -------------------------------------------------------------
  // 1. STOCKS MANAGEMENT (CRUD)
  // -------------------------------------------------------------
  async fetchStocks(filters?: Record<string, any>): Promise<Stock[]> {
    try {
      const res = await apiClient.get<Stock[]>('/stocks', filters);
      if (res.success && Array.isArray(res.data)) {
        this.saveStocks(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Could not fetch stocks from backend, using cache:', err);
    }
    return this.getStocks();
  },

  getStocks(): Stock[] {
    try {
      const stored = localStorage.getItem(ADMIN_STOCKS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [...MOCK_STOCKS];
  },

  getStockById(id: string): Stock | null {
    const stocks = this.getStocks();
    return stocks.find((s) => s.id === id || s.slug === id) || null;
  },

  saveStocks(stocks: Stock[]): void {
    try {
      localStorage.setItem(ADMIN_STOCKS_KEY, JSON.stringify(stocks));
    } catch {
      // ignore
    }
  },

  async createStock(stockData: Omit<Stock, 'id'>): Promise<Stock> {
    // 1. Call real backend API and await server response
    const res = await apiClient.post<Stock>('/stocks', stockData);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'মাছের স্টক ডাটাবেজে সংরক্ষণ করা সম্ভব হয়নি। সার্ভার সংযোগ ও লগইন অবস্থা পরীক্ষা করুন।');
    }

    const savedStock = res.data;

    // 2. Update local cache with real server record
    const stocks = this.getStocks();
    const filtered = stocks.filter((s) => s.id !== savedStock.id && s.slug !== savedStock.slug);
    filtered.unshift(savedStock);
    this.saveStocks(filtered);

    this.logAction('নতুন মাছের স্টক পোস্ট তৈরি', 'stock', savedStock.banglaName, `${savedStock.quantity} ${savedStock.unit} (${savedStock.location})`);

    // 3. Notify all open views across the application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_stocks_updated', { detail: savedStock }));
    }

    return savedStock;
  },

  async updateStock(id: string, updates: Partial<Stock>): Promise<Stock> {
    const res = await apiClient.put<Stock>(`/stocks/${id}`, updates);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'স্টক আপডেট করা সম্ভব হয়নি।');
    }

    const updated = res.data;
    const stocks = this.getStocks();
    const index = stocks.findIndex((s) => s.id === id || s.slug === id);
    if (index !== -1) {
      stocks[index] = updated;
    } else {
      stocks.unshift(updated);
    }
    this.saveStocks(stocks);
    this.logAction('স্টক আপডেট করা হয়েছে', 'stock', updated.banglaName, `স্ট্যাটাস: ${updated.status}, মূল্য: ৳${updated.price || 0}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_stocks_updated', { detail: updated }));
    }

    return updated;
  },

  async deleteStock(id: string): Promise<boolean> {
    const res = await apiClient.delete(`/stocks/${id}`);
    if (!res.success) {
      throw new Error(res.error || 'স্টক ডিলিট করা সম্ভব হয়নি।');
    }

    const stocks = this.getStocks();
    const target = stocks.find((s) => s.id === id || s.slug === id);
    const resolvedId = target?.id || id;
    const filtered = stocks.filter((s) => s.id !== id && s.slug !== id);
    this.saveStocks(filtered);

    // Sync corresponding seller lot: mark it as stock deleted, so it moves to "ডিলিট করা লট"
    const lots = this.getSellerLots();
    let lotModified = false;
    lots.forEach((l) => {
      if (l.convertedStockId === resolvedId || l.convertedStockId === id) {
        l.stockDeletedAt = new Date().toISOString();
        l.stockDeletedName = target?.banglaName || target?.productName || resolvedId;
        l.isStockDeleted = true;
        lotModified = true;
      }
    });
    if (lotModified) {
      this.saveSellerLots(lots);
    }

    if (target) {
      this.logAction('স্টক পোস্ট অপসারণ', 'stock', target.banglaName, `ID: ${id}`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_stocks_updated', { detail: { id, deleted: true } }));
      if (lotModified) {
        window.dispatchEvent(new CustomEvent('gangchill_seller_lots_updated'));
      }
    }

    return true;
  },

  async toggleStockStatus(id: string, newStatus: StockStatus): Promise<Stock> {
    const res = await apiClient.patch<Stock>(`/stocks/${id}/status`, { status: newStatus });
    if (!res.success || !res.data) {
      throw new Error(res.error || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
    }

    const updated = res.data;
    const stocks = this.getStocks();
    const idx = stocks.findIndex((s) => s.id === id || s.slug === id);
    if (idx !== -1) {
      stocks[idx] = updated;
      this.saveStocks(stocks);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_stocks_updated', { detail: updated }));
    }

    return updated;
  },

  // -------------------------------------------------------------
  // 2. BUYER ORDERS & REQUIREMENTS MANAGEMENT
  // -------------------------------------------------------------
  async fetchBuyerOrders(): Promise<BuyerOrder[]> {
    try {
      const res = await apiClient.get<BuyerOrder[]>('/orders');
      if (res.success && Array.isArray(res.data)) {
        this.saveBuyerOrders(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    return this.getBuyerOrders();
  },

  getBuyerOrders(): BuyerOrder[] {
    try {
      const stored = localStorage.getItem(ADMIN_ORDERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  getOrderById(id: string): BuyerOrder | null {
    const orders = this.getBuyerOrders();
    return orders.find((o) => o.id === id) || null;
  },

  saveBuyerOrders(orders: BuyerOrder[]): void {
    try {
      localStorage.setItem(ADMIN_ORDERS_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  },

  async updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string, actor = 'অ্যাডমিন'): Promise<BuyerOrder | null> {
    const res = await apiClient.patch<BuyerOrder>(`/orders/${orderId}/status`, { orderStatus: newStatus, note, actor });
    if (!res.success || !res.data) {
      throw new Error(res.error || 'অর্ডার স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
    }

    const updated = res.data;
    const orders = this.getBuyerOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index] = updated;
    } else {
      orders.unshift(updated);
    }
    this.saveBuyerOrders(orders);
    this.logAction('অর্ডার স্ট্যাটাস আপডেট', 'order', `${updated.companyName} (${updated.productName})`, `নতুন স্ট্যাটাস: ${newStatus} (${actor})`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_orders_updated', { detail: updated }));
    }
    return updated;
  },

  async addOrderInternalNote(orderId: string, text: string, author = 'অ্যাডমিন'): Promise<BuyerOrder | null> {
    const res = await apiClient.post<BuyerOrder>(`/orders/${orderId}/notes`, { text, author });
    if (!res.success || !res.data) {
      throw new Error(res.error || 'নোট সংরক্ষণ করা সম্ভব হয়নি।');
    }

    const updated = res.data;
    const orders = this.getBuyerOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index] = updated;
    } else {
      orders.unshift(updated);
    }
    this.saveBuyerOrders(orders);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_orders_updated', { detail: updated }));
    }
    return updated;
  },

  async updateOrderQuote(orderId: string, quotedPricePerUnit: number): Promise<BuyerOrder | null> {
    const res = await apiClient.patch<BuyerOrder>(`/orders/${orderId}/quote`, { quotedPricePerUnit });
    if (!res.success || !res.data) {
      throw new Error(res.error || 'কোটেশন প্রাইস আপডেট ব্যর্থ হয়েছে।');
    }

    const updated = res.data;
    const orders = this.getBuyerOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index] = updated;
    } else {
      orders.unshift(updated);
    }
    this.saveBuyerOrders(orders);
    this.logAction('কোটেশন প্রাইস আপডেট', 'order', updated.companyName, `দর: ৳${quotedPricePerUnit}/${updated.unit}, মোট: ৳${updated.totalEstimatedValue}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_orders_updated', { detail: updated }));
    }
    return updated;
  },

  // -------------------------------------------------------------
  // 3. SELLER LOTS & SOURCING MANAGEMENT
  // -------------------------------------------------------------
  getSellerLots(): SellerLot[] {
    try {
      const stored = localStorage.getItem(ADMIN_SELLER_LOTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  getSellerLotById(id: string): SellerLot | null {
    const lots = this.getSellerLots();
    return lots.find((l) => l.id === id) || null;
  },

  saveSellerLots(lots: SellerLot[]): void {
    try {
      localStorage.setItem(ADMIN_SELLER_LOTS_KEY, JSON.stringify(lots));
    } catch {
      // ignore
    }
  },

  async fetchSellerLots(): Promise<SellerLot[]> {
    try {
      const res = await apiClient.get<SellerLot[]>('/submissions/seller-lots');
      if (res.success && Array.isArray(res.data)) {
        this.saveSellerLots(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    return this.getSellerLots();
  },

  async updateSellerLotStatus(lotId: string, status: 'pending' | 'verified' | 'approved' | 'rejected', notes?: string): Promise<SellerLot | null> {
    const lots = this.getSellerLots();
    const index = lots.findIndex((l) => l.id === lotId);
    if (index === -1) return null;

    const lot = lots[index];
    lot.verificationStatus = status;
    if (notes) lot.inspectionNotes = notes;

    lots[index] = lot;
    this.saveSellerLots(lots);
    this.logAction('ঘাট সরবরাহ যাচাই আপডেট', 'seller_lot', `${lot.farmerName} (${lot.productName})`, `স্ট্যাটাস: ${status}`);

    // Sync with backend API
    try {
      await apiClient.patch(`/submissions/seller-lots/${lotId}/status`, { status, notes });
    } catch (e) {
      console.error(e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_seller_lots_updated'));
    }

    return lot;
  },

  async convertLotToStock(lotId: string, stockOverrides?: Partial<Stock>): Promise<Stock | null> {
    const lot = this.getSellerLotById(lotId);
    if (!lot) return null;

    const createdStock = await this.createStock({
      slug: `${lot.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      productName: lot.productName,
      banglaName: lot.productName,
      category: 'দেশি মাছ',
      status: lot.stockType === 'current' ? 'live' : 'upcoming',
      quantity: lot.quantity,
      unit: lot.unit,
      location: lot.location,
      district: lot.district,
      division: 'বিভাগ',
      availabilityDate: lot.availabilityDate || 'আজকের তাজা সংগ্রহ',
      grade: 'ফিল্ড ভেরিফাইড গ্রেড A',
      packaging: 'ইনসুলেটেড আইস ক্রেট',
      price: lot.expectedPrice || 0,
      description: lot.description || `${lot.district} অঞ্চল থেকে সরাসরি সংগৃহীত।`,
      images: lot.images && lot.images.length > 0 ? lot.images : ['/hero-fishermen-boat.png'],
      ...stockOverrides
    });

    // Mark lot as approved
    const lots = this.getSellerLots();
    const idx = lots.findIndex((l) => l.id === lotId);
    if (idx !== -1) {
      lots[idx].verificationStatus = 'approved';
      lots[idx].convertedStockId = createdStock.id;
      this.saveSellerLots(lots);
    }

    // Sync with backend API
    apiClient.post(`/submissions/seller-lots/${lotId}/convert`, stockOverrides).catch(console.error);

    return createdStock;
  },

  // -------------------------------------------------------------
  // 4. PROCUREMENT FUNDS & INVESTOR INTERESTS
  // -------------------------------------------------------------
  async fetchInvestments(): Promise<InvestmentOpportunity[]> {
    try {
      const res = await apiClient.get<InvestmentOpportunity[]>('/investments');
      if (res.success && Array.isArray(res.data)) {
        this.saveInvestments(res.data);
        return res.data;
      }
    } catch {
      // fallback to cached data
    }
    return this.getInvestments();
  },

  getInvestments(): InvestmentOpportunity[] {
    try {
      const stored = localStorage.getItem(ADMIN_INVESTMENTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [...MOCK_INVESTMENTS];
  },

  saveInvestments(investments: InvestmentOpportunity[]): void {
    try {
      localStorage.setItem(ADMIN_INVESTMENTS_KEY, JSON.stringify(investments));
    } catch {
      // ignore
    }
  },

  async updateInvestmentStatus(id: string, status: 'open' | 'funded' | 'closed'): Promise<InvestmentOpportunity> {
    const res = await apiClient.patch<InvestmentOpportunity>(`/investments/${id}/status`, { status });
    if (!res.success || !res.data) {
      throw new Error(res.error || 'তহবিল প্রকল্পের স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    }
    const updated = res.data;
    const list = this.getInvestments();
    const idx = list.findIndex((i) => i.id === id || i.slug === id);
    if (idx !== -1) {
      list[idx] = updated;
      this.saveInvestments(list);
    }
    this.logAction('তহবিল প্রকল্পের স্ট্যাটাস পরিবর্তন', 'investment', updated.title, `নতুন স্ট্যাটাস: ${status}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_investments_updated', { detail: updated }));
    }
    return updated;
  },

  async createInvestment(opportunity: InvestmentOpportunity): Promise<InvestmentOpportunity> {
    const res = await apiClient.post<InvestmentOpportunity>('/investments', opportunity);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'নতুন তহবিল প্রকল্প ডাটাবেজে সংরক্ষণ করা সম্ভব হয়নি।');
    }
    const saved = res.data;
    const list = this.getInvestments();
    const filtered = list.filter((i) => i.id !== saved.id && i.slug !== saved.slug);
    filtered.unshift(saved);
    this.saveInvestments(filtered);
    this.logAction('নতুন তহবিল প্রকল্প তৈরি', 'investment', saved.title, `টার্গেট ক্যাপিটাল: ৳${saved.requiredCapital.toLocaleString('bn-BD')}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_investments_updated', { detail: saved }));
    }
    return saved;
  },

  async updateInvestment(id: string, updates: Partial<InvestmentOpportunity>): Promise<InvestmentOpportunity> {
    const res = await apiClient.put<InvestmentOpportunity>(`/investments/${id}`, updates);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'তহবিল প্রকল্প আপডেট করা সম্ভব হয়নি।');
    }
    const updated = res.data;
    const list = this.getInvestments();
    const idx = list.findIndex((i) => i.id === id || i.slug === id);
    if (idx !== -1) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveInvestments(list);
    this.logAction('তহবিল প্রকল্প আপডেট', 'investment', updated.title);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_investments_updated', { detail: updated }));
    }
    return updated;
  },

  async deleteInvestment(id: string): Promise<boolean> {
    const res = await apiClient.delete(`/investments/${id}`);
    if (!res.success) {
      throw new Error(res.error || 'তহবিল প্রকল্প মুছে ফেলা সম্ভব হয়নি।');
    }
    const list = this.getInvestments();
    const target = list.find((i) => i.id === id || i.slug === id);
    const filtered = list.filter((i) => i.id !== id && i.slug !== id);
    this.saveInvestments(filtered);
    if (target) {
      this.logAction('তহবিল প্রকল্প মুছে ফেলা', 'investment', target.title);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_investments_updated', { detail: { id, deleted: true } }));
    }
    return true;
  },

  async fetchInvestorInterests(): Promise<InvestorInterest[]> {
    try {
      const res = await apiClient.get<InvestorInterest[]>('/submissions/investor-interests');
      if (res.success && Array.isArray(res.data)) {
        this.saveInvestorInterests(res.data);
        return res.data;
      }
    } catch {
      // fallback to cache
    }
    return this.getInvestorInterests();
  },

  getInvestorInterests(): InvestorInterest[] {
    try {
      const stored = localStorage.getItem(INVESTOR_INTERESTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  saveInvestorInterests(interests: InvestorInterest[]): void {
    try {
      localStorage.setItem(INVESTOR_INTERESTS_KEY, JSON.stringify(interests));
    } catch {
      // ignore
    }
  },

  async updateInvestorInterestStatus(id: string, status: string): Promise<InvestorInterest> {
    const res = await apiClient.patch<InvestorInterest>(`/submissions/investor-interests/${id}/status`, { status });
    if (!res.success || !res.data) {
      throw new Error(res.error || 'আবেদনের স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    }
    const updated = res.data;
    const list = this.getInvestorInterests();
    const idx = list.findIndex((i) => i.id === id);
    if (idx !== -1) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveInvestorInterests(list);
    this.logAction('বিনিয়োগ আবেদন স্ট্যাটাস পরিবর্তন', 'investment', updated.investorName, `স্ট্যাটাস: ${status}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_investments_updated', { detail: updated }));
    }
    return updated;
  },

  async deleteInvestorInterest(id: string): Promise<boolean> {
    const res = await apiClient.delete(`/submissions/investor-interests/${id}`);
    if (!res.success) {
      throw new Error(res.error || 'আবেদন মুছে ফেলা সম্ভব হয়নি।');
    }
    const list = this.getInvestorInterests();
    const filtered = list.filter((i) => i.id !== id);
    this.saveInvestorInterests(filtered);
    this.logAction('বিনিয়োগকারীর আবেদন মুছে ফেলা', 'investment', `ID: ${id}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_investments_updated', { detail: { id, deleted: true } }));
    }
    return true;
  },

  // -------------------------------------------------------------
  // 5. BLOG ARTICLES MANAGEMENT
  // -------------------------------------------------------------
  async fetchBlogPosts(): Promise<BlogPost[]> {
    try {
      const res = await apiClient.get<BlogPost[]>('/blog');
      if (res.success && Array.isArray(res.data)) {
        this.saveBlogPosts(res.data);
        return res.data;
      }
    } catch {
      // fallback
    }
    return this.getBlogPosts();
  },

  getBlogPosts(): BlogPost[] {
    try {
      const stored = localStorage.getItem(ADMIN_BLOG_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [...MOCK_BLOG_POSTS];
  },

  saveBlogPosts(posts: BlogPost[]): void {
    try {
      localStorage.setItem(ADMIN_BLOG_KEY, JSON.stringify(posts));
    } catch {
      // ignore
    }
  },

  async createBlogPost(postData: BlogPost): Promise<BlogPost> {
    const res = await apiClient.post<BlogPost>('/blog', postData);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'ব্লগ আর্টিকেল ডাটাবেজে সংরক্ষণ করা সম্ভব হয়নি।');
    }
    const saved = res.data;
    const posts = this.getBlogPosts();
    const filtered = posts.filter((p) => p.slug !== saved.slug);
    filtered.unshift(saved);
    this.saveBlogPosts(filtered);
    this.logAction('নতুন ব্লগ আর্টিকেল প্রকাশ', 'blog', saved.title, `ক্যাটাগরি: ${saved.category}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_blog_updated', { detail: saved }));
    }
    return saved;
  },

  async updateBlogPost(slug: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const res = await apiClient.put<BlogPost>(`/blog/${slug}`, updates);
    if (!res.success || !res.data) {
      throw new Error(res.error || 'ব্লগ আর্টিকেল আপডেট করা সম্ভব হয়নি।');
    }
    const updated = res.data;
    const posts = this.getBlogPosts();
    const index = posts.findIndex((p) => p.slug === slug);
    if (index !== -1) {
      posts[index] = updated;
    } else {
      posts.unshift(updated);
    }
    this.saveBlogPosts(posts);
    this.logAction('ব্লগ আর্টিকেল আপডেট', 'blog', updated.title, `Slug: ${slug}`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_blog_updated', { detail: updated }));
    }
    return updated;
  },

  async deleteBlogPost(slug: string): Promise<boolean> {
    const res = await apiClient.delete(`/blog/${slug}`);
    if (!res.success) {
      throw new Error(res.error || 'ব্লগ আর্টিকেল মুছে ফেলা সম্ভব হয়নি।');
    }
    const posts = this.getBlogPosts();
    const target = posts.find((p) => p.slug === slug);
    const filtered = posts.filter((p) => p.slug !== slug);
    this.saveBlogPosts(filtered);
    if (target) {
      this.logAction('ব্লগ আর্টিকেল মুছে ফেলা', 'blog', target.title, `Slug: ${slug}`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_blog_updated', { detail: { slug, deleted: true } }));
    }
    return true;
  },

  // -------------------------------------------------------------
  // 6. ACTIVITY LOGS
  // -------------------------------------------------------------
  getActivityLogs(): ActivityLogItem[] {
    try {
      const stored = localStorage.getItem(ADMIN_ACTIVITY_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  logAction(action: string, targetType: ActivityLogItem['targetType'], targetTitle: string, details?: string, actor = 'MD Admin'): void {
    const logs = this.getActivityLogs();
    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      action,
      targetType,
      targetTitle,
      actor,
      timestamp: new Date().toISOString(),
      details
    };
    logs.unshift(newLog);
    try {
      localStorage.setItem(ADMIN_ACTIVITY_KEY, JSON.stringify(logs.slice(0, 30)));
    } catch {
      // ignore
    }
  },

  // -------------------------------------------------------------
  // 7. DASHBOARD METRICS
  // -------------------------------------------------------------
  getDashboardMetrics(): DashboardMetrics {
    const stocks = this.getStocks();
    const orders = this.getBuyerOrders();
    const lots = this.getSellerLots();
    const investments = this.getInvestments();
    const investorInterests = this.getInvestorInterests();

    const liveStocks = stocks.filter((s) => s.status === 'live').length;
    const upcomingStocks = stocks.filter((s) => s.status === 'upcoming').length;
    const soldStocks = stocks.filter((s) => s.status === 'sold').length;

    const pendingRequirementsCount = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'under_review').length;
    const activeOrdersCount = orders.filter((o) => o.orderStatus === 'confirmed' || o.orderStatus === 'processing' || o.orderStatus === 'dispatched').length;
    const completedOrdersCount = orders.filter((o) => o.orderStatus === 'completed').length;

    const pendingSellerLotsCount = lots.filter((l) => l.verificationStatus === 'pending').length;

    const totalInvestmentPledges = investorInterests.length;
    const totalPledgedAmount = investorInterests.reduce((sum, item) => sum + (item.interestedAmount || 0), 0);
    const activeFundProjectsCount = investments.filter((i) => i.status === 'open').length;

    return {
      totalStocks: stocks.length,
      liveStocks,
      upcomingStocks,
      soldStocks,
      pendingRequirementsCount,
      activeOrdersCount,
      completedOrdersCount,
      pendingSellerLotsCount,
      totalInvestmentPledges,
      totalPledgedAmount,
      activeFundProjectsCount
    };
  },

  // -------------------------------------------------------------
  // 8. SETTINGS
  // -------------------------------------------------------------
  getSettings(): PlatformSettings {
    try {
      const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
      if (stored) {
        return {
          ...INITIAL_SETTINGS,
          ...JSON.parse(stored)
        };
      }
    } catch {
      // fallback
    }
    return { ...INITIAL_SETTINGS };
  },

  async fetchSettings(): Promise<PlatformSettings> {
    try {
      const res = await apiClient.get<PlatformSettings>('/settings');
      if (res.success && res.data) {
        const merged = { ...INITIAL_SETTINGS, ...res.data };
        try {
          localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gangchill_settings_updated', { detail: merged }));
        }
        return merged;
      }
    } catch (err) {
      console.warn('Failed to fetch settings from server:', err);
    }
    return this.getSettings();
  },

  async saveSettings(settings: PlatformSettings, actor = 'MD Admin'): Promise<PlatformSettings> {
    try {
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
    this.logAction(
      'প্ল্যাটফর্ম সেটিংস আপডেট',
      'settings',
      'জেনারেল কনফিগারেশন',
      settings.maintenanceMode ? 'রক্ষণাবেক্ষণ মোড (Maintenance Mode) সক্রিয় করা হয়েছে' : 'কোম্পানির তথ্য, হাব ও পলিসি সংরক্ষিত হয়েছে',
      actor
    );

    // Sync with backend API
    try {
      const res = await apiClient.post<PlatformSettings>('/settings', settings);
      if (res.success && res.data) {
        const merged = { ...INITIAL_SETTINGS, ...res.data };
        try {
          localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gangchill_settings_updated', { detail: merged }));
        }
        return merged;
      }
    } catch (err) {
      console.error('Failed to save settings on server:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_settings_updated', { detail: settings }));
    }
    return settings;
  },

  async resetSettings(actor = 'MD Admin'): Promise<PlatformSettings> {
    try {
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
    } catch {
      // ignore
    }
    this.logAction('প্ল্যাটফর্ম সেটিংস রিসেট', 'settings', 'ডিফল্ট কনফিগারেশন', 'প্রাথমিক ডিফল্ট মানে পুনঃস্থাপন', actor);

    try {
      const res = await apiClient.post<PlatformSettings>('/settings/reset');
      if (res.success && res.data) {
        const merged = { ...INITIAL_SETTINGS, ...res.data };
        try {
          localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gangchill_settings_updated', { detail: merged }));
        }
        return merged;
      }
    } catch (err) {
      console.error('Failed to reset settings on server:', err);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gangchill_settings_updated', { detail: INITIAL_SETTINGS }));
    }
    return { ...INITIAL_SETTINGS };
  },

  // -------------------------------------------------------------
  // 9. CUSTOMERS MANAGEMENT (CRUD)
  // -------------------------------------------------------------
  getCustomers(): CustomerProfile[] {
    try {
      const stored = localStorage.getItem(ADMIN_CUSTOMERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  saveCustomers(customers: CustomerProfile[]): void {
    try {
      localStorage.setItem(ADMIN_CUSTOMERS_KEY, JSON.stringify(customers));
    } catch {
      // ignore
    }
  },

  createCustomer(profile: CustomerProfile): CustomerProfile {
    const list = this.getCustomers();
    list.unshift(profile);
    this.saveCustomers(list);
    this.logAction('নতুন করপোরেট বায়ার প্রোফাইল তৈরি', 'order', profile.companyName, `যোগাযোগ: ${profile.contactPerson} (${profile.phone})`);

    apiClient.post('/customers', profile).catch(console.error);
    return profile;
  },

  updateCustomer(id: string, updates: Partial<CustomerProfile>): CustomerProfile | null {
    const list = this.getCustomers();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates };
    this.saveCustomers(list);
    this.logAction('করপোরেট বায়ার প্রোফাইল আপডেট', 'order', list[idx].companyName, `টিয়ার: ${list[idx].tier}`);

    apiClient.put(`/customers/${id}`, updates).catch(console.error);
    return list[idx];
  },

  deleteCustomer(id: string): boolean {
    const list = this.getCustomers();
    const target = list.find((c) => c.id === id);
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return false;

    this.saveCustomers(filtered);
    if (target) {
      this.logAction('করপোরেট বায়ার প্রোফাইল মুছে ফেলা', 'order', target.companyName);
    }

    apiClient.delete(`/customers/${id}`).catch(console.error);
    return true;
  },

  // -------------------------------------------------------------
  // 10. SUPPLIERS MANAGEMENT (CRUD)
  // -------------------------------------------------------------
  getSuppliers(): SupplierProfile[] {
    try {
      const stored = localStorage.getItem(ADMIN_SUPPLIERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  },

  saveSuppliers(suppliers: SupplierProfile[]): void {
    try {
      localStorage.setItem(ADMIN_SUPPLIERS_KEY, JSON.stringify(suppliers));
    } catch {
      // ignore
    }
  },

  createSupplier(profile: SupplierProfile): SupplierProfile {
    const list = this.getSuppliers();
    list.unshift(profile);
    this.saveSuppliers(list);
    this.logAction('নতুন ঘাট ও খামারি প্রোফাইল তৈরি', 'seller_lot', profile.farmerName, `অঞ্চল: ${profile.district}, ফোন: ${profile.phone}`);

    apiClient.post('/suppliers', profile).catch(console.error);
    return profile;
  },

  updateSupplier(id: string, updates: Partial<SupplierProfile>): SupplierProfile | null {
    const list = this.getSuppliers();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates };
    this.saveSuppliers(list);
    this.logAction('ঘাট ও খামারি প্রোফাইল আপডেট', 'seller_lot', list[idx].farmerName, `স্ট্যাটাস: ${list[idx].verificationBadge}`);

    apiClient.put(`/suppliers/${id}`, updates).catch(console.error);
    return list[idx];
  },

  deleteSupplier(id: string): boolean {
    const list = this.getSuppliers();
    const target = list.find((s) => s.id === id);
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) return false;

    this.saveSuppliers(filtered);
    if (target) {
      this.logAction('ঘাট ও খামারি প্রোফাইল মুছে ফেলা', 'seller_lot', target.farmerName);
    }

    apiClient.delete(`/suppliers/${id}`).catch(console.error);
    return true;
  }
};

// Automatically sync in background when running in browser
if (typeof window !== 'undefined') {
  adminService.syncAll();
}
