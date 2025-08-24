import { HttpError } from './http-error.error';

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'ForbiddenError');
  }
}
