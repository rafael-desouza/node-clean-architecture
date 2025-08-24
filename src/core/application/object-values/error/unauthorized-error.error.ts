import { HttpError } from './http-error.error';

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Credenciais inválidas ou não fornecidas') {
    super(message, 401, 'UnauthorizedError');
  }
}
