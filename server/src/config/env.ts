import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment variable schema.
 *
 * This is the ONLY place in the codebase permitted to read `process.env`.
 * Every other module consumes the validated, strongly-typed `env` object (or,
 * preferably, the structured `config` built on top of it). Fail fast: if the
 * environment is invalid we crash at boot with a readable message rather than
 * surfacing `undefined` deep inside a request handler.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  APP_NAME: z.string().min(1).default('wa-broadcast-backend'),
  APP_VERSION: z.string().min(1).default('0.1.0'),

  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  /** Root directory for local persisted state (WhatsApp auth, session metadata). */
  DATA_DIR: z.string().min(1).default('.data'),

  // --- Broadcast delivery pacing / retries (Stage 3B) ---
  /** Minimum random delay before each send, in ms. */
  SEND_DELAY_MIN_MS: z.coerce.number().int().min(0).default(800),
  /** Maximum random delay before each send, in ms. */
  SEND_DELAY_MAX_MS: z.coerce.number().int().min(0).default(2500),
  /** Max BullMQ attempts per recipient (initial try + retries). */
  MAX_SEND_RETRIES: z.coerce.number().int().min(1).max(10).default(3),
}).refine((env) => env.SEND_DELAY_MIN_MS <= env.SEND_DELAY_MAX_MS, {
  message: 'SEND_DELAY_MIN_MS must be <= SEND_DELAY_MAX_MS',
  path: ['SEND_DELAY_MIN_MS'],
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    // The logger depends on config, which depends on this module — so at this
    // stage we intentionally fall back to the console and exit immediately.
    console.error(
      `\n✖ Invalid environment configuration:\n${issues}\n\n` +
        `Copy server/.env.example to server/.env and fill in the required values.\n`,
    );
    process.exit(1);
  }

  return parsed.data;
}

export const env: Env = loadEnv();
