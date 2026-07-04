import pino, { type Logger, type LoggerOptions } from 'pino';
import { config } from '../config/index.js';

/**
 * Centralized structured logger (Pino).
 *
 * - In development we pretty-print for humans.
 * - In production we emit newline-delimited JSON for log shippers.
 *
 * Never use `console.*` for application logging — always go through this
 * logger (or a child of it) so output stays structured and level-filtered.
 */
const transport: LoggerOptions['transport'] | undefined = config.app.isProduction
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };

/**
 * Shared Pino options. Exported so the HTTP layer (Fastify) can build its own
 * request-scoped logger from the exact same configuration — keeping a single
 * source of truth without coupling Fastify's logger type to a concrete Pino
 * instance.
 */
export const loggerOptions: LoggerOptions = {
  level: config.log.level,
  base: {
    app: config.app.name,
    version: config.app.version,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport,
};

/** Root logger for non-request contexts (boot, shutdown, background libs). */
export const logger: Logger = pino(loggerOptions);

/**
 * Create a child logger with additional bound context (e.g. a module name or
 * request id). Prefer this over the root logger inside modules.
 */
export function createLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}
