import { UnauthorizedError } from '@/core/application/object-values/error/unauthorized-error.error';
import { RequestContext } from '@/core/application/ports/http-server-port';
import { TokenServicePort } from '@/core/application/ports/token-service.port';
import { UserRole } from '@/core/domain/user.entity';

export class AuthMiddleware {
  constructor(private tokenService: TokenServicePort) {}

  public async handle(context: RequestContext): Promise<void> {
    const header = context.getHeaders()['authorization'] as string | undefined;

    if (!header) {
      throw new UnauthorizedError('Authorization header not found.');
    }

    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedError('Malformed token.');
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      context.setData('user', {
        id: payload.sub,
        role: payload.role as UserRole,
      });
    } catch {
      throw new UnauthorizedError('Token is invalid or expired.');
    }
  }
}
