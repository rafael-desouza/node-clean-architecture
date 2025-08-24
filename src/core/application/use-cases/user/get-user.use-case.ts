import { UserRole } from '@/core/domain/user.entity';

import { NotFoundError } from '../../object-values/error/not-found-error.error';
import { UserRepository } from '../../repositories/user.repository';
import { Executable } from '../executable';

export interface GetUserInput {
  id: string;
}

export interface GetUserOutput {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export class GetUserUseCase implements Executable<GetUserInput, GetUserOutput> {
  constructor(private userRepository: UserRepository) {}
  async execute(input: GetUserInput): Promise<GetUserOutput> {
    const user = await this.userRepository.findById(input.id);
    if (!user) throw new NotFoundError('User not found');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
