import { UserBuilder } from 'tests/helpers/builders/user.builder';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { NotFoundError } from '@/core/application/object-values/error/not-found-error.error';
import { UnauthorizedError } from '@/core/application/object-values/error/unauthorized-error.error';
import { IdGeneratorPort } from '@/core/application/ports/id-generator.port';
import { PasswordHasherPort } from '@/core/application/ports/password-hasher.port';
import { TokenServicePort } from '@/core/application/ports/token-service.port';
import { SessionRepositoryPort } from '@/core/application/repositories/session.repository';
import { UserRepository } from '@/core/application/repositories/user.repository';
import { SingInLocalUseCase } from '@/core/application/use-cases/auth/sign-in-local-use-case';
import { Session } from '@/core/domain/session.entity';

let mockUserRepository: DeepMockProxy<UserRepository>;
let mockSessionRepository: DeepMockProxy<SessionRepositoryPort>;
let mockHasher: DeepMockProxy<PasswordHasherPort>;
let mockTokens: DeepMockProxy<TokenServicePort>;
let mockIdGenerator: DeepMockProxy<IdGeneratorPort>;
let signInUseCase: SingInLocalUseCase;

describe('SingInLocalUseCase', () => {
  beforeEach(() => {
    mockUserRepository = mockDeep<UserRepository>();
    mockSessionRepository = mockDeep<SessionRepositoryPort>();
    mockHasher = mockDeep<PasswordHasherPort>();
    mockTokens = mockDeep<TokenServicePort>();
    mockIdGenerator = mockDeep<IdGeneratorPort>();

    signInUseCase = new SingInLocalUseCase(
      mockUserRepository,
      mockSessionRepository,
      mockHasher,
      mockTokens,
      mockIdGenerator,
      '15m',
      1000 * 60 * 60 * 24 * 7
    );
  });

  it('should authenticate user and return tokens successfully', async () => {
    const input = { email: 'user@test.com', password: 'password123' };
    const user = new UserBuilder().withEmail(input.email).build();
    const fakeTokens = {
      accessToken: 'fake_access_token',
      refreshToken: 'fake_refresh_token',
      refreshTokenHash: 'hashed_refresh_token',
    };
    const sessionId = 'generated-session-id';

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockHasher.verify.mockResolvedValue(true);
    mockTokens.generateAuthTokens.mockResolvedValue(fakeTokens);
    mockIdGenerator.generate.mockReturnValue(sessionId);

    const result = await signInUseCase.execute(input);

    expect(mockHasher.verify).toHaveBeenCalledWith(
      user.passwordHash,
      input.password
    );
    expect(mockSessionRepository.create).toHaveBeenCalledWith(
      expect.any(Session)
    );
    expect(mockSessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        refreshTokenHash: fakeTokens.refreshTokenHash,
      })
    );
    expect(result).toEqual({
      accessToken: fakeTokens.accessToken,
      refreshToken: fakeTokens.refreshToken,
      userRole: user.role,
    });
  });

  it('should throw NotFoundError if user is not found', async () => {
    const input = { email: 'notfound@test.com', password: 'password123' };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(signInUseCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(mockHasher.verify).not.toHaveBeenCalled();
    expect(mockSessionRepository.create).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedError if password is wrong', async () => {
    const input = { email: 'user@test.com', password: 'wrong_password' };
    const user = new UserBuilder().withEmail(input.email).build();

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockHasher.verify.mockResolvedValue(false);

    await expect(signInUseCase.execute(input)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(mockTokens.generateAuthTokens).not.toHaveBeenCalled();
    expect(mockSessionRepository.create).not.toHaveBeenCalled();
  });
});
