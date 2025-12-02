declare module "@Faworra/logging" {
  export type CreateLoggerOptions = Record<string, unknown>;
  export interface ILogger {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    child?: (...args: any[]) => ILogger;
  }
  export function createLogger(options?: CreateLoggerOptions): ILogger;
}

declare module "pino" {
  export interface LoggerOptions extends Record<string, unknown> {}
  export interface Logger {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    child: (...args: any[]) => Logger;
  }
  const pino: (options?: LoggerOptions) => Logger;
  export default pino;
}
