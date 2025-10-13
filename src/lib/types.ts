
export type UserRole = 'Global Admin' | 'Operations Manager' | 'CEO' | 'Manager' | 'Employee';

export type UserStatus = 'active' | 'pending' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  teamId?: string;
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
      'Employee': number; // Employee is the internal name for "Miembro"
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

    