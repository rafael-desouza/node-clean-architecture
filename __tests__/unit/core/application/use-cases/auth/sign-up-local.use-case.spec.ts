import { UserBuilder } from 'tests/helpers/builders/user.builder';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { DuplicateError } from '@/core/application/object-values/error/duplicate-error.error';
import { IdGeneratorPort } from '@/core/application/ports/id-generator.port';
import { LoggerPort } from '@/core/application/ports/logger.port';
import { PasswordHasherPort } from '@/core/application/ports/password-hasher.port';
import { UserRepository } from '@/core/application/repositories/user.repository';
import { SignUpLocalUseCase } from '@/core/application/use-cases/auth/sign-up-local.use-case';

let mockUserRepository: DeepMockProxy<UserRepository>;
let mockHasher: DeepMockProxy<PasswordHasherPort>;
let mockIdGenerator: DeepMockProxy<IdGeneratorPort>;
let mockLogger: DeepMockProxy<LoggerPort>;
let signUpUseCase: SignUpLocalUseCase;
describe('SignUpLocalUseCase', () => {
  beforeEach(() => {
    mockUserRepository = mockDeep<UserRepository>();
    mockHasher = mockDeep<PasswordHasherPort>();
    mockIdGenerator = mockDeep<IdGeneratorPort>();
    mockLogger = mockDeep<LoggerPort>();

    signUpUseCase = new SignUpLocalUseCase(
      mockUserRepository,
      mockHasher,
      mockIdGenerator,
      mockLogger
    );
  });

  it('should create a new user successfully', async () => {
    const input = {
      email: 'john.doe@test.com',
      password: 'PlainPassword123',
    };
    const hashedPassword = 'hashed_password';
    const generatedId = 'generated-uuid-123';

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockHasher.hash.mockResolvedValue(hashedPassword);
    mockIdGenerator.generate.mockReturnValue(generatedId);

    const output = await signUpUseCase.execute(input);

    expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: generatedId,
        email: input.email,
        passwordHash: hashedPassword,
      })
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      `User created successfully with id: ${generatedId}`
    );

    expect(output).toEqual({
      id: generatedId,
      email: input.email,
      role: 'user',
    });
  });

  it('should throw DuplicateError if email is already used', async () => {
    const input = {
      email: 'jane.doe@test.com',
      password: 'PlainPassword123',
    };
    const existingUser = new UserBuilder().withEmail(input.email).build();
    mockUserRepository.findByEmail.mockResolvedValue(existingUser);

    await expect(signUpUseCase.execute(input)).rejects.toBeInstanceOf(
      DuplicateError
    );

    expect(mockHasher.hash).not.toHaveBeenCalled();
    expect(mockIdGenerator.generate).not.toHaveBeenCalled();
    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });
});
