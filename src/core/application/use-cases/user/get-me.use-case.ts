import { UserRole } from '@/core/domain/user.entity';

import { NotFoundError } from '../../object-values/error/not-found-error.error';
import { UserRepository } from '../../repositories/user.repository';
import { Executable } from '../executable';

export interface GetMeInput {
  userId: string;
}

export interface GetMeOutput {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export class GetMeUseCase implements Executable<GetMeInput, GetMeOutput> {
  constructor(private userRepository: UserRepository) {}
  async execute(input: GetMeInput): Promise<GetMeOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
