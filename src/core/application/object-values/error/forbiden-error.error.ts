import { HttpError } from './http-error.error';

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, 'ForbiddenError');
  }
}
