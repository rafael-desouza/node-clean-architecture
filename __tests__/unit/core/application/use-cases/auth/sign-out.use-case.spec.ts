import { SessionBuilder } from 'tests/helpers/builders/session.builder';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { TokenServicePort } from '@/core/application/ports/token-service.port';
import { SessionRepositoryPort } from '@/core/application/repositories/session.repository';
import { SignOutUseCase } from '@/core/application/use-cases/auth/sign-out.use-case';

let mockSessionRepository: DeepMockProxy<SessionRepositoryPort>;
let mockTokens: DeepMockProxy<TokenServicePort>;
let signOutUseCase: SignOutUseCase;

describe('SignOutUseCase', () => {
  beforeEach(() => {
    mockSessionRepository = mockDeep<SessionRepositoryPort>();
    mockTokens = mockDeep<TokenServicePort>();
    signOutUseCase = new SignOutUseCase(mockSessionRepository, mockTokens);
  });

  it('should revoke the session if a valid refresh token is provided', async () => {
    const refreshToken = 'valid_refresh_token';
    const tokenHash = 'hashed_token';
    const session = new SessionBuilder().build();

    mockTokens.hashRefreshToken.mockReturnValue(tokenHash);
    mockSessionRepository.findByTokenHash.mockResolvedValue(session);

    await signOutUseCase.execute({ refreshToken });

    expect(mockTokens.hashRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(mockSessionRepository.findByTokenHash).toHaveBeenCalledWith(
      tokenHash
    );
    expect(mockSessionRepository.revoke).toHaveBeenCalledWith(session.id);
  });

  it('should do nothing if the session is not found', async () => {
    const refreshToken = 'invalid_or_expired_token';
    const tokenHash = 'hashed_token';

    mockTokens.hashRefreshToken.mockReturnValue(tokenHash);
    mockSessionRepository.findByTokenHash.mockResolvedValue(null);

    await signOutUseCase.execute({ refreshToken });

    expect(mockSessionRepository.findByTokenHash).toHaveBeenCalledWith(
      tokenHash
    );

    expect(mockSessionRepository.revoke).not.toHaveBeenCalled();
  });
});
