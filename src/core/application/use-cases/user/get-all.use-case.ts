import { User, UserRole } from '@/core/domain/user.entity';

import { PaginatedOutput } from '../../object-values/interfaces/paginated-return';
import { UserRepository } from '../../repositories/user.repository';
import { Executable } from '../executable';

export interface GetUsersInput {
  page: number;
  limit: number;
}

export interface UserOutput {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export class GetUsersUseCase
  implements Executable<GetUsersInput, PaginatedOutput<UserOutput>>
{
  constructor(private userRepository: UserRepository) {}
  async execute(input: GetUsersInput): Promise<PaginatedOutput<UserOutput>> {
    const { page, limit } = input;

    const { data, total } = await this.userRepository.findAll(input);
    const sanitizedUsers = this.sanitizeUsers(data);

    return {
      data: sanitizedUsers,
      total,
      currentPage: page,
      perPage: limit,
      lastPage: Math.ceil(total / limit),
    };
  }

  private sanitizeUsers(users: User[]): UserOutput[] {
    return users.map((user) => {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    });
  }
}
