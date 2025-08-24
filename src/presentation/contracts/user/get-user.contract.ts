import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const UserRoleSchema = z.enum(['user', 'admin']);

const GetUserInputSchema = z.object({
  id: z.string('id is required.'),
});

export const GetUserOutputSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: UserRoleSchema,
  createdAt: z.date().or(z.string()),
});

export class GetUserContract {
  static validate(input: unknown) {
    return GetUserInputSchema.parse(input);
  }

  static getInputSchema() {
    return GetUserInputSchema;
  }

  static getOutputSchema() {
    return GetUserOutputSchema;
  }
}
