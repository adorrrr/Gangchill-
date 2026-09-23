import {
  FarmerStockSubmission,
  CorporateRequirement,
  InvestorInterest,
  ContactMessage
} from '../types/forms';
import { apiClient } from './apiClient';

export const submissionService = {
  /**
   * Submit farmer / ghat stock lot to server
   */
  async submitFarmerStock(
    data: Omit<FarmerStockSubmission, 'id' | 'createdAt' | 'status'>
  ): Promise<{ success: boolean; submissionId: string; message: string }> {
    try {
      const res = await apiClient.post<{ submissionId: string; message: string }>(
        '/submissions/farmer-stock',
        data
      );

      if (res.success && res.data) {
        return {
          success: true,
          submissionId: res.data.submissionId,
          message: res.data.message || 'আপনার পণ্যের তথ্য সফলভাবে জমা হয়েছে।'
        };
      }

      return {
        success: false,
        submissionId: '',
        message: res.error || 'তথ্য জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      };
    } catch (err: any) {
      return {
        success: false,
        submissionId: '',
        message: err.message || 'সার্ভার সংযোগ বিচ্ছিন্ন।'
      };
    }
  },

  /**
   * Submit corporate buyer stock requirement to server
   */
  async submitCorporateRequirement(
    data: Omit<CorporateRequirement, 'id' | 'createdAt' | 'status'>
  ): Promise<{ success: boolean; requirementId: string; message: string }> {
    try {
      const res = await apiClient.post<{ requirementId: string; message: string }>(
        '/submissions/corporate-requirement',
        data
      );

      if (res.success && res.data) {
        return {
          success: true,
          requirementId: res.data.requirementId,
          message: res.data.message || 'আপনার করপোরেট চাহিদাপত্র গৃহীত হয়েছে।'
        };
      }

      return {
        success: false,
        requirementId: '',
        message: res.error || 'চাহিদাপত্র জমা দিতে সমস্যা হয়েছে।'
      };
    } catch (err: any) {
      return {
        success: false,
        requirementId: '',
        message: err.message || 'সার্ভার সংযোগ বিচ্ছিন্ন।'
      };
    }
  },

  /**
   * Submit investor expression of interest
   */
  async submitInvestorInterest(
    data: Omit<InvestorInterest, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; interestId: string; message: string }> {
    try {
      const res = await apiClient.post<{ interestId: string; message: string }>(
        '/submissions/investor-interest',
        data
      );

      if (res.success && res.data) {
        return {
          success: true,
          interestId: res.data.interestId,
          message: res.data.message || 'বিনিয়োগের আগ্রহ প্রকাশের জন্য ধন্যবাদ।'
        };
      }

      return {
        success: false,
        interestId: '',
        message: res.error || 'তথ্য জমা দিতে সমস্যা হয়েছে।'
      };
    } catch (err: any) {
      return {
        success: false,
        interestId: '',
        message: err.message || 'সার্ভার সংযোগ বিচ্ছিন্ন।'
      };
    }
  },

  /**
   * Submit a general contact message
   */
  async submitContactMessage(
    data: Omit<ContactMessage, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; messageId: string }> {
    try {
      const res = await apiClient.post<{ messageId: string }>('/submissions/contact', data);
      if (res.success && res.data) {
        return {
          success: true,
          messageId: res.data.messageId
        };
      }
      return {
        success: false,
        messageId: ''
      };
    } catch {
      return {
        success: false,
        messageId: ''
      };
    }
  }
};
