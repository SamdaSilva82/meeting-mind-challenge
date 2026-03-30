import { config } from 'dotenv';
import { join } from 'node:path';

/**
 * Resolves `.env` files for this workspace when npm/Turbo runs scripts with
 * `process.cwd()` set to `apps/api` (the package root).
 *
 * Load order: package-local first, then monorepo `starter/` root. With dotenv’s
 * default `override: false`, the first file to set a key wins — so
 * `apps/api/.env` can override shared keys from `starter/.env`.
 */
export function getApiEnvFilePaths(): string[] {
  return [
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '..', '.env'),
  ];
}

/**
 * Non-Nest entrypoints (e.g. TypeORM CLI) must call this; Nest uses
 * `ConfigModule.forRoot({ envFilePath })` instead.
 */
export function loadApiEnvFiles(): void {
  for (const path of getApiEnvFilePaths()) {
    config({ path, override: false });
  }
}
