import {
  HttpMethod,
  HttpServerPort,
} from '@/core/application/ports/http-server-port';
import { GetUsersUseCase } from '@/core/application/use-cases/user/get-all.use-case';
import { GetMeUseCase } from '@/core/application/use-cases/user/get-me.use-case';
import { GetUserUseCase } from '@/core/application/use-cases/user/get-user.use-case';
import { GetMeContract } from '@/presentation/contracts/user/get-me.contract';
import { GetUserContract } from '@/presentation/contracts/user/get-user.contract';

import { GetUsersContract } from '../contracts/user/get-users.contract';
import { AuthGuard } from '../guards/auth.guard';

export class UserController {
  constructor(
    private readonly httpServer: HttpServerPort,
    private readonly authGuard: AuthGuard,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly getUserUseCase: GetUserUseCase
  ) {
    this.httpServer.route({
      method: HttpMethod.GET,
      path: '/users',
      middleware: this.authGuard.protect(['admin']),
      handler: async (_body, _params, query) => {
        const validatedQuery = GetUsersContract.validate(query);
        return this.getUsersUseCase.execute(validatedQuery);
      },
      schema: {
        summary: 'Get a list of users',
        description: 'Get a list o users',
        tags: ['Users'],
        bodySchema: GetUsersContract.getInputSchema(),
        responses: {
          200: GetUsersContract.getOutputSchema(),
        },
      },
    });

    this.httpServer.route({
      method: HttpMethod.GET,
      path: '/users/me',
      middleware: this.authGuard.protect(),
      handler: async (_body, _params, _query, context) => {
        const { id: userId } = GetMeContract.validate(context!.user);
        return this.getMeUseCase.execute({ userId });
      },
      schema: {
        summary: 'Get the logged user',
        tags: ['Users'],
        responses: {
          200: GetMeContract.getOutputSchema(),
        },
      },
    });

    this.httpServer.route({
      method: HttpMethod.GET,
      path: '/users/:id',
      middleware: this.authGuard.protect(['admin']),
      handler: async (_body, params) => {
        const validatedQuery = GetUserContract.validate(params);
        return this.getUserUseCase.execute(validatedQuery);
      },
      schema: {
        summary: 'Get a specific user by ID',
        tags: ['Users'],
      },
    });
  }
}
