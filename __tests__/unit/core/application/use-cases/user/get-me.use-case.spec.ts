import { UserBuilder } from 'tests/helpers/builders/user.builder';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { NotFoundError } from '@/core/application/object-values/error/not-found-error.error';
import { UserRepository } from '@/core/application/repositories/user.repository';
import { GetMeUseCase } from '@/core/application/use-cases/user/get-me.use-case';

let mockUserRepository: DeepMockProxy<UserRepository>;
let getMeUseCase: GetMeUseCase;

describe('GetMeUseCase', () => {
  beforeEach(() => {
    mockUserRepository = mockDeep<UserRepository>();
    getMeUseCase = new GetMeUseCase(mockUserRepository);
  });

  it('should return user successfully', async () => {
    const userId = 'existing-user-id';

    const fakeUser = new UserBuilder().withId(userId).build();

    mockUserRepository.findById.mockResolvedValue(fakeUser);

    const result = await getMeUseCase.execute({ userId });

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);

    expect(result).toEqual({
      id: fakeUser.id,
      email: fakeUser.email,
      role: fakeUser.role,
      createdAt: fakeUser.createdAt,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should throw NotFoundError if user is not found', async () => {
    const userId = 'non-existent-user-id';

    mockUserRepository.findById.mockResolvedValue(null);

    await expect(getMeUseCase.execute({ userId })).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(getMeUseCase.execute({ userId })).rejects.toThrow(
      'User not found'
    );
  });
});
