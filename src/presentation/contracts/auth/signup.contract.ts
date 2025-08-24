import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { UserRoleSchema } from '@/presentation/contracts/user/get-users.contract';

extendZodWithOpenApi(z);

export const SignUpLocalInputSchema = z.object({
  email: z.email('Invalid email').openapi('User email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long')
    .regex(/[a-zA-Z]/, 'Password must contain letters')
    .regex(/[0-9]/, 'Password must contain numbers')
    .openapi('User password'),
  role: UserRoleSchema.optional().default('user').openapi('User role'),
});

export const SignUpLocalOutputSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: UserRoleSchema.default('user'),
});

export class SignUpContract {
  static validate(input: unknown) {
    return SignUpLocalInputSchema.parse(input);
  }

  static getInputSchema() {
    return SignUpLocalInputSchema;
  }

  static getOutputSchema() {
    return SignUpLocalOutputSchema;
  }
}
