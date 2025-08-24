import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { GetMeUseCase } from '@/core/application/use-cases/user/get-me.use-case';
import { GetUserUseCase } from '@/core/application/use-cases/user/get-user.use-case';
import * as schema from '@/infra/persistence/drizzle/schema';

import { RefreshTokenUseCase } from './core/application/use-cases/auth/refresh-token.use-case';
import { SingInLocalUseCase } from './core/application/use-cases/auth/sign-in-local-use-case';
import { SignOutUseCase } from './core/application/use-cases/auth/sign-out.use-case';
import { SignUpLocalUseCase } from './core/application/use-cases/auth/sign-up-local.use-case';
import { GetUsersUseCase } from './core/application/use-cases/user/get-all.use-case';
import { Argon2PasswordHasher } from './infra/adapters/crypto/argon2-password-hasher';
import { ZodOpenApiDocumentation } from './infra/adapters/documentation/zod-open-api';
import { FastifyHttpServerAdapter } from './infra/adapters/http-server/fastify-http-server';
import { FastifyErrorHandlerMiddleware } from './infra/adapters/http-server/middlewares/fastify-error-handler.middleware';
import { UuidGenerator } from './infra/adapters/id-generator/uuid-id-generator.service';
import { WinstonLooger } from './infra/adapters/logging/winston-logger';
import { JoseTokenService } from './infra/adapters/tokens/jose-token-service';
import { SessionRepositoryDrizzle } from './infra/repositories/session/session.repository.drizzle';
import { UserRepositoryDrizzle } from './infra/repositories/user/user.repository.drizzle';
import { AuthController } from './presentation/controllers/auth.controller';
import { UserController } from './presentation/controllers/user.controller';
import { AuthGuard } from './presentation/guards/auth.guard';
import { AuthMiddleware } from './presentation/middleware/auth.middleware';

function parseToMs(ttl: string): number {
  const m = ttl.match(/^(\d+)([smhd])$/);
  if (!m) return 1000 * 60 * 60 * 24 * 30;
  const n = Number(m[1]);
  const u = m[2];
  return u === 's'
    ? n * 1000
    : u === 'm'
      ? n * 60 * 1000
      : u === 'h'
        ? n * 60 * 60 * 1000
        : n * 24 * 60 * 60 * 1000;
}

export class CompositionRoot {
  private readonly db: NodePgDatabase<typeof schema>;
  private readonly accessTtl: string;
  private readonly refreshTtlMs: number;

  constructor(private readonly dataBaseUrl: string) {
    const pool = new Pool({ connectionString: this.dataBaseUrl });
    this.db = drizzle(pool, { schema });

    this.accessTtl = process.env.ACCESS_TOKEN_TTL || '15m';
    this.refreshTtlMs = parseToMs(process.env.REFRESH_TOKEN_TTL || '30d');
  }

  public createAndBindControllers() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined!');
    }

    // Adapters & Services
    const logger = new WinstonLooger();
    const errorHandler = new FastifyErrorHandlerMiddleware(logger);
    const openApi = new ZodOpenApiDocumentation();
    const idService = new UuidGenerator();
    const hasherService = new Argon2PasswordHasher();
    const tokensService = new JoseTokenService(jwtSecret);

    //HTTP Server
    const httpServer = new FastifyHttpServerAdapter(
      logger,
      errorHandler,
      openApi
    );

    // Repositories
    const userRepository = new UserRepositoryDrizzle(this.db);
    const sessionRepository = new SessionRepositoryDrizzle(this.db);

    // Middlewares & Guards
    const authMiddleware = new AuthMiddleware(tokensService);
    const authGuard = new AuthGuard(authMiddleware);

    // Use Cases
    const signUpLocalUseCase = new SignUpLocalUseCase(
      userRepository,
      hasherService,
      idService,
      logger
    );
    const singInLocalUseCase = new SingInLocalUseCase(
      userRepository,
      sessionRepository,
      hasherService,
      tokensService,
      idService,
      this.accessTtl,
      this.refreshTtlMs
    );
    const refreshTokenUseCase = new RefreshTokenUseCase(
      userRepository,
      sessionRepository,
      tokensService,
      idService,
      this.accessTtl,
      this.refreshTtlMs
    );
    const signOutUseCase = new SignOutUseCase(sessionRepository, tokensService);

    const getUsers = new GetUsersUseCase(userRepository);
    const getMeUseCase = new GetMeUseCase(userRepository);
    const getUserUseCase = new GetUserUseCase(userRepository);

    new AuthController(
      httpServer,
      signUpLocalUseCase,
      singInLocalUseCase,
      refreshTokenUseCase,
      signOutUseCase
    );
    new UserController(
      httpServer,
      authGuard,
      getUsers,
      getMeUseCase,
      getUserUseCase
    );

    return { httpServer, logger };
  }
}
