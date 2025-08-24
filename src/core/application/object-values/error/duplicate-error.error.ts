import { HttpError } from './http-error.error';

export class DuplicateError extends HttpError {
  constructor(message: string = 'The resource already exists') {
    super(message, 409, 'DuplicateError');
  }
}
