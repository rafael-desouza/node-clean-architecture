import { User, UserRole } from '@/core/domain/user.entity';

import { DuplicateError } from '../../object-values/error/duplicate-error.error';
import { IdGeneratorPort } from '../../ports/id-generator.port';
import { LoggerPort } from '../../ports/logger.port';
import { PasswordHasherPort } from '../../ports/password-hasher.port';
import { UserRepository } from '../../repositories/user.repository';
import { Executable } from '../executable';

export interface SignUpLocalInput {
  email: string;
  password: string;
  role?: UserRole;
}

export interface SignUpLocalOutput {
  id: string;
  email: string;
  role: UserRole;
}

export class SignUpLocalUseCase
  implements Executable<SignUpLocalInput, SignUpLocalOutput>
{
  constructor(
    private userRepository: UserRepository,
    private hasher: PasswordHasherPort,
    private idGenerator: IdGeneratorPort,
    private logger: LoggerPort
  ) {}

  async execute(input: SignUpLocalInput): Promise<SignUpLocalOutput> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new DuplicateError('email already in use');

    const passwordHash = await this.hasher.hash(input.password);
    const userId = this.idGenerator.generate();
    const user = User.create({
      id: userId,
      email: input.email,
      passwordHash: passwordHash,
      role: input.role,
    });

    await this.userRepository.create(user);
    this.logger.info(`User created successfully with id: ${user.id}`);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
