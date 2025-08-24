import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { UserRoleSchema } from '@/presentation/contracts/user/get-users.contract';

extendZodWithOpenApi(z);

export const SignInLocalInputSchema = z.object({
  email: z.email('Invalid email').openapi('User email'),
  password: z.string(),
  userAgent: z.email('Invalid user agent').optional().openapi('User email'),
  ip: z.ipv6('Invalid IP').optional().openapi('User email'),
});

export const SignInLocalOutputSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userRole: UserRoleSchema,
});

export class SignInContract {
  static validate(input: unknown) {
    return SignInLocalInputSchema.parse(input);
  }

  static getInputSchema() {
    return SignInLocalInputSchema;
  }

  static getOutputSchema() {
    return SignInLocalOutputSchema;
  }
}
