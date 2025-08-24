import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const SignOutInputSchema = z.object({
  refreshToken: z.string('refreshToken is required.'),
});

export class SignOutContract {
  static validate(input: unknown) {
    return SignOutInputSchema.parse(input);
  }

  static getInputSchema() {
    return SignOutInputSchema;
  }
}
