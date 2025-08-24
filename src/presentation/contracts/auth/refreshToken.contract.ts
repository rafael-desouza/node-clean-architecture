import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { UserRoleSchema } from '@/presentation/contracts/user/get-users.contract';

extendZodWithOpenApi(z);

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
  userAgent: z.email('Invalid user agent').optional().openapi('User email'),
  ip: z.ipv6('Invalid IP').optional().openapi('User email'),
});

export const RefreshTokenOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userRole: UserRoleSchema,
});

export class RefreshTokenContract {
  static validate(input: unknown) {
    return RefreshTokenSchema.parse(input);
  }

  static getInputSchema() {
    return RefreshTokenSchema;
  }

  static getOutputSchema() {
    return RefreshTokenOutputSchema;
  }
}
