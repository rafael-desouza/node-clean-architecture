export interface LoggerPort {
  info(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}
