import { Session } from '@/core/domain/session.entity';
import { UserRole } from '@/core/domain/user.entity';

import { NotFoundError } from '../../object-values/error/not-found-error.error';
import { UnauthorizedError } from '../../object-values/error/unauthorized-error.error';
import { IdGeneratorPort } from '../../ports/id-generator.port';
import { PasswordHasherPort } from '../../ports/password-hasher.port';
import { TokenServicePort } from '../../ports/token-service.port';
import { SessionRepositoryPort } from '../../repositories/session.repository';
import { UserRepository } from '../../repositories/user.repository';
import { Executable } from '../executable';

export interface SingInLocalInput {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
}

export interface SingInLocalOutput {
  accessToken: string;
  refreshToken: string;
  userRole: UserRole;
}

export class SingInLocalUseCase
  implements Executable<SingInLocalInput, SingInLocalOutput>
{
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepositoryPort,
    private hasher: PasswordHasherPort,
    private tokens: TokenServicePort,
    private idGenerator: IdGeneratorPort,
    private accessTtl: string,
    private refreshTtlMs: number
  ) {}

  async execute(input: SingInLocalInput): Promise<SingInLocalOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new NotFoundError('User not found');

    const validPassword = await this.hasher.verify(
      user.passwordHash,
      input.password
    );
    if (!validPassword) throw new UnauthorizedError('Invalid credentials');

    const { accessToken, refreshToken, refreshTokenHash } =
      await this.tokens.generateAuthTokens(
        { sub: user.id, role: user.role },
        this.accessTtl
      );

    const sessionId = this.idGenerator.generate();
    const session = Session.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      userAgent: input.userAgent,
      ip: input.ip,
      sessionDurationMs: this.refreshTtlMs,
    });
    await this.sessionRepository.create(session);

    return {
      accessToken,
      refreshToken,
      userRole: user.role,
    };
  }
}
