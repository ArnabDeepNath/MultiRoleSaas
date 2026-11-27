export type UserRole = 'SUPER_ADMIN' | 'SERVICE_PROVIDER' | 'STUDENT' | 'PARENT' | 'TEACHER' | 'TRANSPORTER';
export type ProviderType = 'TEACHER' | 'TRANSPORTER' | 'INSTITUTION';
export type PaymentStatus = 'PENDING' | 'COMPLETED';
export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRANSPORTER_BASIC' | 'TRANSPORTER_PRO' | 'TRANSPORTER_ENTERPRISE' | 'FREE_PROVIDER';
export type SubscriptionBilling = 'MONTHLY' | 'YEARLY';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
  phoneNumber?: string;
  paymentStatus: PaymentStatus;
  isDemo?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionBilling?: SubscriptionBilling;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  country?: string;
  pincode?: string;
  blocked?: boolean;
  lat?: number;
  lng?: number;
  locationCapturedAt?: number;
  locationAccuracy?: number;
}

export interface ServiceProviderProfile extends UserProfile {
  role: 'SERVICE_PROVIDER' | 'TEACHER' | 'TRANSPORTER';
  providerType: ProviderType | string;
  bio?: string;
  rating?: number;
  services: string[];
  earnings?: number;
  institutionName?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}

export interface StudentProfile extends UserProfile {
  role: 'STUDENT';
  parentId?: string;
  assignedServices: string[];
  grade?: string;
  school?: string;
  board?: string;
}

export interface ParentProfile extends UserProfile {
  role: 'PARENT';
  children: string[];
}

export interface AppSettings {
  registrationFee: number;
  allowedServiceProviderTypes: string[];
  maintenanceMode: boolean;
  adminKey: string;
  platformCommission?: number;
  providerFreePlanEnabled?: boolean;
  defaultProviderCoins?: number;
  leadUnlockCost?: number;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  paymentMethod?: string;
  plan?: SubscriptionPlan;
  billing?: SubscriptionBilling;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  providerType: string;
  category?: string;
  subject?: string;
  school?: string;
  board?: string;
  hobby?: string;
  otherMaster?: string;
  route?: string;
  vehicleType?: string;
  lat?: number;
  lng?: number;
  location?: string;
  address?: string;
  state?: string;
  district?: string;
  rating?: number;
  reviews?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  studentId: string;
  providerId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  updatedAt: number;
}

export interface Child {
  uid: string;
  name: string;
  grade: string;
  school: string;
  services: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: number;
}

export interface EscrowTransaction {
  id: string;
  payerId: string;
  providerId: string;
  amount: number;
  commission: number;
  status: 'HELD' | 'RELEASED' | 'REFUNDED';
  serviceName: string;
  createdAt: number;
  releasedAt?: number;
}

export interface LeadProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  providerType?: string;
  lat: number;
  lng: number;
  state?: string;
  district?: string;
  city?: string;
  hasPhone?: boolean;
  updatedAt: number;
}

export interface LeadContact {
  uid: string;
  email: string;
  phoneNumber: string;
}

export interface CoinWallet {
  uid: string;
  balance: number;
  lastUnlockId?: string;
  updatedAt: number;
}

export interface LeadUnlock {
  id: string;
  providerId: string;
  leadId: string;
  coinsSpent: number;
  createdAt: number;
}

export interface SubscriptionConfig {
  plan: SubscriptionPlan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  color: string;
  approved?: boolean;
  status?: string;
  role?: UserRole;
  roles?: UserRole[];
  providerType?: ProviderType;
  providerTypes?: ProviderType[];
}
