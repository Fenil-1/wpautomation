import { Prisma } from '@prisma/client';

/** True when the error is a Prisma unique-constraint violation (P2002). */
export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

/** True when the error is a Prisma "record not found" violation (P2025). */
export function isRecordNotFoundError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}
