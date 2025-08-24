import { createHash, createSecretKey, KeyObject, randomBytes } from 'crypto';
import { JWTPayload as JoseJWTPayload, jwtVerify, SignJWT } from 'jose';

import {
  AuthTokens,
  JwtPayload,
  TokenServicePort,
} from '@/core/application/ports/token-service.port';

export class JoseTokenService implements TokenServicePort {
  private readonly secret: KeyObject;

  constructor(private readonly jwtSecret: string) {
    this.secret = createSecretKey(Buffer.from(this.jwtSecret, 'utf8'));
  }

  async generateAuthTokens(
    payload: JwtPayload,
    accessTtl: string
  ): Promise<AuthTokens> {
    const accessToken = await this.generateAccessToken(payload, accessTtl);
    const refreshToken = await this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    return {
      accessToken,
      refreshToken,
      refreshTokenHash,
    };
  }
  async generateAccessToken(payload: JwtPayload, ttl: string) {
    const token = await new SignJWT(payload as unknown as JoseJWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ttl)
      .sign(this.secret);
    return token;
  }
  async verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, this.secret);
    return payload as unknown as JwtPayload;
  }
  async generateRefreshToken() {
    return randomBytes(48).toString('base64url');
  }
  hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
