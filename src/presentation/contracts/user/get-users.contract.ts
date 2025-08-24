import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { PaginationSchema } from '../common-schema';

extendZodWithOpenApi(z);

export const UserRoleSchema = z.enum(['user', 'admin']);

export const GetUsersOutputSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: UserRoleSchema,
  createdAt: z.date().or(z.string()),
});

export class GetUsersContract {
  static validate(input: unknown) {
    return PaginationSchema.parse(input);
  }

  static getInputSchema() {
    return PaginationSchema;
  }

  static getOutputSchema() {
    return GetUsersOutputSchema;
  }
}
