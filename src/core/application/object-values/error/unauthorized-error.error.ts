import { HttpError } from './http-error.error';

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UnauthorizedError');
  }
}
