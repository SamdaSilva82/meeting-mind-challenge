"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiEnvFilePaths = getApiEnvFilePaths;
exports.loadApiEnvFiles = loadApiEnvFiles;
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
/**
 * Resolves `.env` files for this workspace when npm/Turbo runs scripts with
 * `process.cwd()` set to `apps/api` (the package root).
 *
 * Load order: package-local first, then monorepo `starter/` root. With dotenv’s
 * default `override: false`, the first file to set a key wins — so
 * `apps/api/.env` can override shared keys from `starter/.env`.
 */
function getApiEnvFilePaths() {
    return [
        (0, node_path_1.join)(process.cwd(), '.env'),
        (0, node_path_1.join)(process.cwd(), '..', '..', '.env'),
    ];
}
/**
 * Non-Nest entrypoints (e.g. TypeORM CLI) must call this; Nest uses
 * `ConfigModule.forRoot({ envFilePath })` instead.
 */
function loadApiEnvFiles() {
    for (const path of getApiEnvFilePaths()) {
        (0, dotenv_1.config)({ path, override: false });
    }
}
//# sourceMappingURL=api-env.js.map