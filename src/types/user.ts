// User-related types

export type UserRole = 'admin' | 'participant';

export interface UserProfile {
  id: string;
  email: string;
  register_number: string | null;
  display_name: string;
  department: string | null;
  year: string | null;
  role: UserRole;
  created_at: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  display_name: string;
  register_number: string;
  department: Department;
  year: Year;
}

export type Department = 'ECE' | 'EEE' | 'CSE' | 'IT' | 'MECH' | 'CIVIL' | 'Other';
export type Year = '1st' | '2nd' | '3rd' | '4th';

export const DEPARTMENTS: Department[] = ['ECE', 'EEE', 'CSE', 'IT', 'MECH', 'CIVIL', 'Other'];
export const YEARS: Year[] = ['1st', '2nd', '3rd', '4th'];

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfile;
  role?: UserRole;
}

export interface AdminStats {
  totalParticipants: number;
  activeRounds: number;
  totalAttemptsToday: number;
  disqualifiedParticipants: number;
  submittedAttempts: number;
}

export interface RecentActivity {
  id: string;
  type: 'registration' | 'attempt_started' | 'attempt_submitted' | 'disqualification';
  message: string;
  timestamp: string;
  userId: string;
  userName: string;
}
