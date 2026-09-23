import { Stock, StockStatus } from '../types/stock';
import { apiClient } from './apiClient';

export interface StockFilterOptions {
  category?: string;
  status?: StockStatus | 'all';
  district?: string;
  searchQuery?: string;
}

export const stockService = {
  /**
   * Fetch all stocks with optional server-side filters
   */
  async getStocks(filters?: StockFilterOptions): Promise<Stock[]> {
    try {
      const params: Record<string, any> = {};
      if (filters?.status && filters.status !== 'all') params.status = filters.status;
      if (filters?.category && filters.category !== 'সব') params.category = filters.category;
      if (filters?.district && filters.district !== 'সব জেলা') params.district = filters.district;
      if (filters?.searchQuery && filters.searchQuery.trim() !== '') params.searchQuery = filters.searchQuery.trim();

      const res = await apiClient.get<Stock[]>('/stocks', params);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch stocks from API:', err);
      return [];
    }
  },

  /**
   * Get single stock by slug or id
   */
  async getStockBySlug(slug: string): Promise<Stock | null> {
    try {
      const res = await apiClient.get<Stock>(`/stocks/${encodeURIComponent(slug)}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch stock ${slug}:`, err);
      return null;
    }
  },

  /**
   * Get live/available stocks
   */
  async getLiveStocks(limit?: number): Promise<Stock[]> {
    try {
      const res = await apiClient.get<Stock[]>('/stocks', { status: 'live' });
      if (res.success && Array.isArray(res.data)) {
        return limit ? res.data.slice(0, limit) : res.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch live stocks:', err);
      return [];
    }
  },

  /**
   * Get upcoming stocks
   */
  async getUpcomingStocks(limit?: number): Promise<Stock[]> {
    try {
      const res = await apiClient.get<Stock[]>('/stocks', { status: 'upcoming' });
      if (res.success && Array.isArray(res.data)) {
        return limit ? res.data.slice(0, limit) : res.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch upcoming stocks:', err);
      return [];
    }
  },

  /**
   * Get available categories for filtering
   */
  async getCategories(): Promise<string[]> {
    try {
      const res = await apiClient.get<string[]>('/stocks/categories');
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
      return ['সব'];
    } catch {
      return ['সব'];
    }
  }
};
