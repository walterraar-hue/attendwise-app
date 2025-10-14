



export type UserRole = 'Global Admin' | 'Operations Manager' | 'CEO' | 'Manager' | 'Miembro';

export type UserStatus = 'active' | 'pending' | 'inactive';

export interface User {
  id?: string; // User's UID from Firebase Auth - now optional
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
      'Manager': number;
      'Miembro': number;
  }
  policies: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'Present' | 'Absent' | 'Late' | 'On Leave';
}

export type Role = "admin" | "manager";

    