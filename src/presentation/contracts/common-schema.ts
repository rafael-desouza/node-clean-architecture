import z from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1).meta({
    description: 'Page number (>= 1)',
    example: 1,
  }),
  limit: z.coerce.number().int().min(1).max(100).default(20).meta({
    description: 'Items per page (1–100)',
    example: 20,
  }),
});

export const ErrorResponseSchema = z
  .object({
    statusCode: z.number(),
    error: z.string(),
    message: z.string(),
  })
  .meta({
    title: 'ErrorResponse',
    description: 'Schema para respostas de erro padrão.',
  });

export const NoContentResponseSchema = z.null().meta({
  title: 'NoContentResponse',
  description: 'Resposta sem corpo de retorno.',
});
