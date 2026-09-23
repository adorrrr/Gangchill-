import { CorporateRequirement, FarmerStockSubmission } from './forms';

export type AdminRole = 'superadmin' | 'admin';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  designation?: string;
  avatar?: string;
  phone?: string;
  lastLogin?: string;
}

export type OrderStatus =
  | 'pending'
  | 'under_review'
  | 'quoted'
  | 'confirmed'
  | 'processing'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
  note?: string;
}

export interface BuyerOrder extends CorporateRequirement {
  orderStatus: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  quotedPricePerUnit?: number;
  totalEstimatedValue?: number;
  assignedStaff?: string;
  internalNotesList?: {
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }[];
}

export interface SellerLot extends FarmerStockSubmission {
  verificationStatus: 'pending' | 'verified' | 'approved' | 'rejected';
  fieldInspectorName?: string;
  inspectionNotes?: string;
  approvedWholesalePrice?: number;
  convertedStockId?: string;
  stockDeletedAt?: string;
  stockDeletedName?: string;
  isStockDeleted?: boolean;
}

export interface DashboardMetrics {
  totalStocks: number;
  liveStocks: number;
  upcomingStocks: number;
  soldStocks: number;
  pendingRequirementsCount: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  pendingSellerLotsCount: number;
  totalInvestmentPledges: number;
  totalPledgedAmount: number;
  activeFundProjectsCount: number;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  targetType: 'stock' | 'order' | 'seller_lot' | 'investment' | 'blog' | 'settings';
  targetTitle: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface PlatformSettings {
  platformName: string;
  tagline?: string;
  supportPhone: string;
  supportEmail: string;
  emergencyHotline?: string;
  businessHours?: string;
  headOfficeAddress: string;
  hubLocations: string;
  defaultMoqKg: number;
  coldChainEnabled: boolean;
  allowPublicSellerSubmissions: boolean;
  allowPublicInvestorInterest: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  notifyOnNewOrder?: boolean;
  notifyOnNewLot?: boolean;
  notifyOnNewInvestmentInterest?: boolean;
}

export interface CustomerProfile {
  id: string;
  companyName: string;
  businessType: string;
  contactPerson: string;
  phone: string;
  email: string;
  deliveryLocation: string;
  tier: 'VIP' | 'Regular' | 'New';
  totalOrdersCount: number;
  totalVolumeKg: number;
  totalOrderValue: number;
  lastOrderDate: string;
  preferredFish: string[];
}

export interface SupplierProfile {
  id: string;
  farmerName: string;
  type: 'জেলে সমবায়' | 'ঘের মালিক' | 'ট্রলার কনসোর্টিয়াম' | 'স্বতন্ত্র মাছ চাষী';
  phone: string;
  district: string;
  location: string;
  verificationBadge: 'verified' | 'provisional' | 'new';
  totalLotsCount: number;
  totalVolumeKg: number;
  qualityRating: number;
  primarySpecies: string[];
  joinedDate: string;
}

