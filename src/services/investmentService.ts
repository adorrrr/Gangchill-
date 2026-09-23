import { InvestmentOpportunity, InvestmentStatus } from '../types/investment';
import { apiClient } from './apiClient';

export interface InvestmentFilterOptions {
  status?: InvestmentStatus | 'all';
  category?: string;
}

export const investmentService = {
  /**
   * Fetch all investment opportunities from backend
   */
  async getInvestments(filters?: InvestmentFilterOptions): Promise<InvestmentOpportunity[]> {
    try {
      const res = await apiClient.get<InvestmentOpportunity[]>('/investments');
      if (!res.success || !Array.isArray(res.data)) {
        return [];
      }
      let result = res.data;

      if (!filters) return result;

      if (filters.status && filters.status !== 'all') {
        result = result.filter((inv) => inv.status === filters.status);
      }

      if (filters.category && filters.category !== 'সব') {
        result = result.filter((inv) => inv.category === filters.category);
      }

      return result;
    } catch (err) {
      console.error('Failed to fetch investments:', err);
      return [];
    }
  },

  /**
   * Get single investment by slug
   */
  async getInvestmentBySlug(slug: string): Promise<InvestmentOpportunity | null> {
    try {
      const res = await apiClient.get<InvestmentOpportunity>(`/investments/${encodeURIComponent(slug)}`);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch investment ${slug}:`, err);
      return null;
    }
  },

  /**
   * Get featured/open opportunities for homepage
   */
  async getFeaturedInvestments(limit?: number): Promise<InvestmentOpportunity[]> {
    try {
      const all = await this.getInvestments({ status: 'open' });
      return limit ? all.slice(0, limit) : all;
    } catch {
      return [];
    }
  }
};
