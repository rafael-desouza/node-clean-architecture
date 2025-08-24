export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly data: unknown;

  constructor(
    message: string,
    statusCode: number,
    name?: string,
    data?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = name ?? 'Internal Server Error';
    this.data = data;
  }
}
