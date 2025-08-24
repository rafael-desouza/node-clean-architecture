import { Session } from '@/core/domain/session.entity';

import { UnauthorizedError } from '../../object-values/error/unauthorized-error.error';
import { IdGeneratorPort } from '../../ports/id-generator.port';
import { TokenServicePort } from '../../ports/token-service.port';
import { SessionRepositoryPort } from '../../repositories/session.repository';
import { UserRepository } from '../../repositories/user.repository';
import { Executable } from '../executable';

interface RefreshTokenInput {
  refreshToken: string;
  userAgent?: string | null;
  ip?: string | null;
}

interface RefreshTokenOutput {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase
  implements Executable<RefreshTokenInput, RefreshTokenOutput>
{
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepositoryPort,
    private tokens: TokenServicePort,
    private idGenerator: IdGeneratorPort,
    private accessTtl: string,
    private refreshTtlMs: number
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const hash = this.tokens.hashRefreshToken(input.refreshToken);
    const oldSession = await this.sessionRepository.findByTokenHash(hash);
    if (!oldSession) throw new UnauthorizedError('Invalid refresh token');

    oldSession.validateForRefresh();

    const user = await this.userRepository.findById(oldSession.userId);
    if (!user) {
      await this.sessionRepository.revoke(oldSession.id);
      throw new UnauthorizedError('Invalid session');
    }

    await this.sessionRepository.revoke(oldSession.id);

    const { accessToken, refreshToken, refreshTokenHash } =
      await this.tokens.generateAuthTokens(
        { sub: user.id, role: user.role },
        this.accessTtl
      );
    const newSessionId = this.idGenerator.generate();
    const newSession = Session.create({
      id: newSessionId,
      userId: user.id,
      refreshTokenHash,
      userAgent: input.userAgent,
      ip: input.ip,
      sessionDurationMs: this.refreshTtlMs,
    });
    oldSession.replace(newSessionId);

    await this.sessionRepository.update(oldSession);
    await this.sessionRepository.create(newSession);

    return {
      sessionId: newSession.id,
      accessToken,
      refreshToken,
    };
  }
}
