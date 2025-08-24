import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const UserRoleSchema = z.enum(['user', 'admin']);

const GetMeInputSchema = z.object({
  id: z.string('id is required.'),
});

export const GetMeOutputSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: UserRoleSchema,
  createdAt: z.date().or(z.string()),
});

export class GetMeContract {
  static validate(input: unknown) {
    return GetMeInputSchema.parse(input);
  }

  static getOutputSchema() {
    return GetMeOutputSchema;
  }
}
