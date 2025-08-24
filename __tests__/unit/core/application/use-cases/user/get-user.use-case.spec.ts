import { UserBuilder } from 'tests/helpers/builders/user.builder';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { NotFoundError } from '@/core/application/object-values/error/not-found-error.error';
import { UserRepository } from '@/core/application/repositories/user.repository';
import { GetUserUseCase } from '@/core/application/use-cases/user/get-user.use-case';

let mockUserRepository: DeepMockProxy<UserRepository>;
let getUserByIdUseCase: GetUserUseCase;

describe('GetUserUseCase', () => {
  beforeEach(() => {
    mockUserRepository = mockDeep<UserRepository>();
    getUserByIdUseCase = new GetUserUseCase(mockUserRepository);
  });

  it('should return user data when a user is found by ID', async () => {
    const userId = 'existing-user-id';
    const fakeUser = new UserBuilder().withId(userId).build();

    mockUserRepository.findById.mockResolvedValue(fakeUser);

    const result = await getUserByIdUseCase.execute({ id: userId });

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual({
      id: fakeUser.id,
      email: fakeUser.email,
      role: fakeUser.role,
      createdAt: fakeUser.createdAt,
    });
  });

  it('should throw a NotFoundError if the user is not found', async () => {
    const userId = 'non-existent-user-id';
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(
      getUserByIdUseCase.execute({ id: userId })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
