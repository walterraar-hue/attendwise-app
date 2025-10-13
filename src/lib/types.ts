export type UserRole = 'Global Admin' | 'Manager' | 'Employee';

export type UserStatus = 'active' | 'pending' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string;
  teamId?: string;
}

export interface Company {
  id: string;
  name: string;
  subscription: {
    plan: 'Basic' | 'Pro' | 'Enterprise';
    userLimit: number;
    recordLimit: number;
    usedSlots: number;
  };
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
