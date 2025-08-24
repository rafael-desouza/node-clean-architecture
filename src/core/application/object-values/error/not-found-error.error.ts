import { HttpError } from './http-error.error';

export class NotFoundError extends HttpError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404, 'NotFoundError');
  }
}
