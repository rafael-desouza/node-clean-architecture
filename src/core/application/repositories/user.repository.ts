import { User } from '@/core/domain/user.entity';

import { GetUsersInput } from '../use-cases/user/get-all.use-case';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(input: GetUsersInput): Promise<{ data: User[]; total: number }>;
  create(data: User): Promise<void>;
}
