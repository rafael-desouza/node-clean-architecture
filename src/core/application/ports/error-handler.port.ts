export interface ErrorHandlerPort {
  handle(
    error: unknown,
    sendResponse: (status: number, body: unknown) => void
  ): void;
}
