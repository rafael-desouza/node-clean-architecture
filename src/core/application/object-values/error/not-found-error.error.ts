import { HttpError } from './http-error.error';

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NotFoundError');
  }
}
