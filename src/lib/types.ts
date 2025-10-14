

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
  
  // Check-in details
  checkInTimestamp: any; // Firestore Timestamp
  appointmentTime: string;
  appointmentEndTime?: string; // Scheduled end time
  workCenterId: string;
  checkInLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkInImageUrl: string;
  aiPunctualityAnalysis: string | null;

  // Check-out details (optional)
  checkOutTimestamp?: any; // Firestore Timestamp
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  checkOutImageUrl?: string;
  aiCheckoutAnalysis?: string | null; // AI analysis for checkout
  
  // Status of the record
  status: 'open' | 'closed';
}


export interface WorkCenter {
  id: string;
  name: string;
  createdAt: any;
}

export type Role = "admin" | "manager";
