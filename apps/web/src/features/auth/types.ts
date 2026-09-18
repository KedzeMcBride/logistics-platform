import type { AuthUser } from '@repo/shared';

export type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: 'CUSTOMER' | 'DRIVER';
};
