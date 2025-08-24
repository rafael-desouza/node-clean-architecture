import { UserBuilder } from 'tests/helpers/builders/user.builder';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { UserRepository } from '@/core/application/repositories/user.repository';
import { GetUsersUseCase } from '@/core/application/use-cases/user/get-all.use-case';

let mockUserRepository: DeepMockProxy<UserRepository>;
let getUsersUseCase: GetUsersUseCase;

describe('GetUsersUseCase', () => {
  beforeEach(() => {
    mockUserRepository = mockDeep<UserRepository>();
    getUsersUseCase = new GetUsersUseCase(mockUserRepository);
  });

  it('should return a paginated user list', async () => {
    const input = { page: 1, limit: 10 };

    const fakeUsers = [
      new UserBuilder().withEmail('user1@test.com').build(),
      new UserBuilder().withRole('admin').build(),
    ];

    mockUserRepository.findAll.mockResolvedValue({
      data: fakeUsers,
      total: 2,
    });

    const result = await getUsersUseCase.execute(input);

    expect(result.total).toBe(2);
    expect(result.currentPage).toBe(1);
    expect(result.perPage).toBe(10);
    expect(result.lastPage).toBe(1);
    expect(result.data).toHaveLength(2);

    expect(result.data[0]).toEqual({
      id: fakeUsers[0].id,
      email: fakeUsers[0].email,
      role: fakeUsers[0].role,
      createdAt: fakeUsers[0].createdAt,
    });

    expect(result.data[0]).not.toHaveProperty('password');
  });

  it('should return an empty list if none user is found', async () => {
    const input = { page: 1, limit: 10 };

    mockUserRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
    });

    const result = await getUsersUseCase.execute(input);

    expect(result.total).toBe(0);
    expect(result.data).toHaveLength(0);
    expect(result.lastPage).toBe(0);
  });
});
