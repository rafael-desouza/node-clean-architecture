import { ForbiddenError } from '@/core/application/object-values/error/forbiden-error.error';
import { RequestContext } from '@/core/application/ports/http-server-port';
import { UserRole } from '@/core/domain/user.entity';

import { AuthMiddleware } from '../middleware/auth.middleware';

type MiddlewareFn = (context: RequestContext) => Promise<void>;

export class AuthGuard {
  constructor(private authMiddleware: AuthMiddleware) {}

  public protect(allowedRoles?: UserRole[]): MiddlewareFn[] {
    const middlewareChain: MiddlewareFn[] = [
      this.authMiddleware.handle.bind(this.authMiddleware),
    ];

    if (allowedRoles && allowedRoles.length > 0) {
      const authorizationMiddleware: MiddlewareFn = async (
        context: RequestContext
      ) => {
        const user = context.getData<{ id: string; role: UserRole }>('user');

        if (!user || !allowedRoles.includes(user.role)) {
          throw new ForbiddenError(
            'You do not have permission to access this resource.'
          );
        }
      };

      middlewareChain.push(authorizationMiddleware);
    }

    return middlewareChain;
  }
}
