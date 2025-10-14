

export type UserRole = 'Global Admin' | 'Operations Manager' | 'CEO' | 'Manager' | 'Miembro';

export type UserStatus = 'active' | 'pending' | 'inactive';

export interface User {
  id: string; // User's UID from Firebase Auth
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  teamId?: string;
  companyId: string;
  isRoleLocked?: boolean;
}

export interface Company {
  id: string;
  name: string;
  subscriptionPlan: 'basic' | 'pro' | 'premium';
  usedSlots: number;
  roleLimits: {
      'Global Admin': number;
      'Operations Manager': number;
      'CEO': number;
      'Miembro': number;
  }
  policies: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  timestamp: any; // Firestore Timestamp
  type: 'check-in' | 'check-out';
  workCenterId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  imageUrl: string;
  aiAnalysis: string | null;
  appointmentTime: string;
}


export interface WorkCenter {
  id: string;
  name: string;
  createdAt: any;
}

export type Role = "admin" | "manager";
