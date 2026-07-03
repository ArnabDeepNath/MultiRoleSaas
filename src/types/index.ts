export type UserRole = 'SUPER_ADMIN' | 'SERVICE_PROVIDER' | 'STUDENT' | 'PARENT';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
  phoneNumber?: string;
}

export interface ServiceProviderProfile extends UserProfile {
  role: 'SERVICE_PROVIDER';
  providerType: string; // e.g., 'driver', 'teacher', 'etc.'
  bio?: string;
  rating?: number;
  services: string[]; // Array of service IDs
}

export interface StudentProfile extends UserProfile {
  role: 'STUDENT';
  parentId?: string; // Reference to Parent's UID
  assignedServices: string[]; // Array of service IDs they are using
}

export interface ParentProfile extends UserProfile {
  role: 'PARENT';
  children: string[]; // Array of Student UIDs
}

export interface AppSettings {
  registrationFee: number;
  allowedServiceProviderTypes: string[];
  maintenanceMode: boolean;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  paymentMethod?: string;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  providerType: string;
}