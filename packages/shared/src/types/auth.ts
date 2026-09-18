import type { Role } from '../enums/role';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: AuthUser;
};
