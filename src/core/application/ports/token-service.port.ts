import { UserRole } from '@/core/domain/user.entity';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
}

export interface TokenServicePort {
  generateAuthTokens(
    payload: JwtPayload,
    accessTtl: string
  ): Promise<AuthTokens>;
  hashRefreshToken(token: string): string;
  verifyAccessToken(token: string): Promise<JwtPayload>;
}
