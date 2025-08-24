import {
  HttpMethod,
  HttpServerPort,
} from '@/core/application/ports/http-server-port';
import { RefreshTokenUseCase } from '@/core/application/use-cases/auth/refresh-token.use-case';
import { SingInLocalUseCase } from '@/core/application/use-cases/auth/sign-in-local-use-case';
import { SignOutUseCase } from '@/core/application/use-cases/auth/sign-out.use-case';
import { SignUpLocalUseCase } from '@/core/application/use-cases/auth/sign-up-local.use-case';
import { RefreshTokenContract } from '@/presentation/contracts/auth/refreshToken.contract';
import { SignOutContract } from '@/presentation/contracts/auth/signout.contract';
import {
  ErrorResponseSchema,
  NoContentResponseSchema,
} from '@/presentation/contracts/common-schema';

import { SignInContract } from '../contracts/auth/signin.contract';
import { SignUpContract } from '../contracts/auth/signup.contract';

export class AuthController {
  constructor(
    private readonly httpServer: HttpServerPort,
    private readonly signUp: SignUpLocalUseCase,
    private readonly signIn: SingInLocalUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly signOut: SignOutUseCase
  ) {
    this.httpServer.route({
      method: HttpMethod.POST,
      path: '/auth/signup',
      successStatusCode: 201,
      handler: async (body) => {
        const data = SignUpContract.validate(body);
        return this.signUp.execute(data);
      },
      schema: {
        summary: 'Create a new account',
        description: 'Create a new account',
        tags: ['auth'],
        bodySchema: SignUpContract.getInputSchema(),
        responses: {
          201: SignUpContract.getOutputSchema(),
        },
      },
    });

    this.httpServer.route({
      method: HttpMethod.POST,
      path: '/auth/signin',
      handler: async (body) => {
        const data = SignInContract.validate(body);
        return this.signIn.execute(data);
      },
      schema: {
        summary: 'Create a new account',
        description: 'Create a new account',
        tags: ['auth'],
        bodySchema: SignInContract.getInputSchema(),
        responses: {
          200: SignInContract.getOutputSchema(),
        },
      },
    });

    this.httpServer.route({
      method: HttpMethod.POST,
      path: '/auth/refresh',
      handler: async (body) => {
        const data = RefreshTokenContract.validate(body);
        return this.refreshToken.execute(data);
      },
      schema: {
        summary: 'Gera um novo par de tokens',
        description: 'Usa um refresh token para obter um novo access token.',
        tags: ['auth'],
        bodySchema: RefreshTokenContract.getInputSchema(),
        responses: {
          200: RefreshTokenContract.getOutputSchema(),
        },
      },
    });

    this.httpServer.route({
      method: HttpMethod.POST,
      path: '/auth/signout',
      successStatusCode: 204,
      handler: async (body) => {
        const data = SignOutContract.validate(body);
        return this.signOut.execute(data);
      },
      schema: {
        summary: 'Create a new account',
        description: 'Create a new account',
        tags: ['auth'],
        bodySchema: SignOutContract.getInputSchema(),
        responses: {
          204: NoContentResponseSchema.meta({
            description: 'Sessão encerrada com sucesso.',
          }),
          401: ErrorResponseSchema.meta({
            description:
              'Não autorizado. O access token é inválido ou não foi fornecido.',
          }),
        },
      },
    });
  }
}
