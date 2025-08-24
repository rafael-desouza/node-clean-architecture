import { TokenServicePort } from '@/core/application/ports/token-service.port';
import { UserRole } from '@/core/domain/user.entity';

declare module 'fastify' {
  export interface FastifyInstance {
    tokens: TokenServicePort;
  }

  export interface FastifyRequest {
    user?: {
      id: string;
      role: UserRole;
    };
  }
}
