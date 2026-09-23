export interface FarmerStockSubmission {
  id: string;
  farmerName: string;
  phone: string;
  district: string;
  productName: string;
  stockType: 'current' | 'upcoming';
  quantity: number;
  unit: string;
  location: string;
  availabilityDate?: string;
  expectedPrice?: number;
  description?: string;
  images?: string[];
  status?: 'draft' | 'submitted';
  createdAt?: string;
}

export interface CorporateRequirement {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  stockId?: string;
  productName: string;
  quantity: number;
  unit: string;
  requiredDate?: string;
  deliveryLocation: string;
  specification?: string;
  notes?: string;
  status?: 'pending' | 'reviewed';
  quotedPricePerUnit?: number;
  totalEstimatedValue?: number;
  createdAt?: string;
}

export interface InvestorInterest {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  investorName: string;
  phone: string;
  email?: string;
  interestedAmount: number;
  notes?: string;
  status?: 'pending' | 'contacted' | 'reviewed' | 'approved' | 'rejected' | string;
  expectedProfit?: number;
  createdAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt?: string;
}
