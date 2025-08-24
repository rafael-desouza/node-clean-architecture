import { TokenServicePort } from '../../ports/token-service.port';
import { SessionRepositoryPort } from '../../repositories/session.repository';
import { Executable } from '../executable';

export interface SignOutInput {
  refreshToken: string;
}

export class SignOutUseCase implements Executable<SignOutInput, void> {
  constructor(
    private sessionRepository: SessionRepositoryPort,
    private tokens: TokenServicePort
  ) {}

  async execute(input: SignOutInput): Promise<void> {
    const tokenHash = this.tokens.hashRefreshToken(input.refreshToken);
    const session = await this.sessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      return;
    }

    await this.sessionRepository.revoke(session.id);
  }
}
