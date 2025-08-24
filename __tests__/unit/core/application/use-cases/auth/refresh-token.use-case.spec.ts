import { SessionBuilder } from 'tests/helpers/builders/session.builder';
import { UserBuilder } from 'tests/helpers/builders/user.builder';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { UnauthorizedError } from '@/core/application/object-values/error/unauthorized-error.error';
import { IdGeneratorPort } from '@/core/application/ports/id-generator.port';
import { TokenServicePort } from '@/core/application/ports/token-service.port';
import { SessionRepositoryPort } from '@/core/application/repositories/session.repository';
import { UserRepository } from '@/core/application/repositories/user.repository';
import { RefreshTokenUseCase } from '@/core/application/use-cases/auth/refresh-token.use-case';
import { Session } from '@/core/domain/session.entity';

let mockUserRepository: DeepMockProxy<UserRepository>;
let mockSessionRepository: DeepMockProxy<SessionRepositoryPort>;
let mockTokens: DeepMockProxy<TokenServicePort>;
let mockIdGenerator: DeepMockProxy<IdGeneratorPort>;
let refreshTokenUseCase: RefreshTokenUseCase;

describe('RefreshTokenUseCase', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUserRepository = mockDeep<UserRepository>();
    mockSessionRepository = mockDeep<SessionRepositoryPort>();
    mockTokens = mockDeep<TokenServicePort>();
    mockIdGenerator = mockDeep<IdGeneratorPort>();

    refreshTokenUseCase = new RefreshTokenUseCase(
      mockUserRepository,
      mockSessionRepository,
      mockTokens,
      mockIdGenerator,
      '15m',
      1000 * 60 * 60 * 24 * 7
    );
  });
  it('should successfully refresh tokens and rotate the session', async () => {
    const oldSession = new SessionBuilder().build();
    const user = new UserBuilder().withId(oldSession.userId).build();
    const newTokens = {
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
      refreshTokenHash: 'new_hashed_refresh_token',
    };
    const newSessionId = 'new-session-id';

    mockTokens.hashRefreshToken.mockReturnValue('hashed_token');
    mockSessionRepository.findByTokenHash.mockResolvedValue(oldSession);
    mockUserRepository.findById.mockResolvedValue(user);
    mockTokens.generateAuthTokens.mockResolvedValue(newTokens);
    mockIdGenerator.generate.mockReturnValue(newSessionId);

    const validateSpy = vi.spyOn(oldSession, 'validateForRefresh');
    const replaceSpy = vi.spyOn(oldSession, 'replace');

    const result = await refreshTokenUseCase.execute({
      refreshToken: 'old_token',
    });

    expect(validateSpy).toHaveBeenCalledOnce();
    expect(mockSessionRepository.revoke).toHaveBeenCalledWith(oldSession.id);
    expect(mockSessionRepository.update).toHaveBeenCalledWith(oldSession);
    expect(replaceSpy).toHaveBeenCalledWith(newSessionId);
    expect(mockSessionRepository.create).toHaveBeenCalledWith(
      expect.any(Session)
    );
    expect(result).toEqual({
      sessionId: newSessionId,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  });

  it('should throw UnauthorizedError if the refresh token is not found', async () => {
    mockTokens.hashRefreshToken.mockReturnValue('hashed_token');
    mockSessionRepository.findByTokenHash.mockResolvedValue(null);

    await expect(
      refreshTokenUseCase.execute({ refreshToken: 'not_found_token' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should throw UnauthorizedError if the session is invalid', async () => {
    const expiredSession = new SessionBuilder().thatIsExpired().build();
    mockTokens.hashRefreshToken.mockReturnValue('hashed_token');
    mockSessionRepository.findByTokenHash.mockResolvedValue(expiredSession);

    await expect(
      refreshTokenUseCase.execute({ refreshToken: 'expired_token' })
    ).rejects.toThrow('Refresh token is expired');
  });

  it('should throw UnauthorizedError and revoke session if user is not found', async () => {
    const session = new SessionBuilder().build();
    mockTokens.hashRefreshToken.mockReturnValue('hashed_token');
    mockSessionRepository.findByTokenHash.mockResolvedValue(session);
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      refreshTokenUseCase.execute({ refreshToken: 'token_for_deleted_user' })
    ).rejects.toThrow('Invalid session');

    expect(mockSessionRepository.revoke).toHaveBeenCalledWith(session.id);
  });
});
