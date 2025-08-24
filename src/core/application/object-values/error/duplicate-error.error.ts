import { HttpError } from './http-error.error';

export class DuplicateError extends HttpError {
  constructor(message: string = 'O recurso já existe') {
    super(message, 409, 'DuplicateError');
  }
}
