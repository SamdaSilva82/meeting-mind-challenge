"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = void 0;
const api_env_1 = require("../config/api-env");
const typeorm_1 = require("typeorm");
(0, api_env_1.loadApiEnvFiles)();
exports.dataSourceOptions = {
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://meetingmind:meetingmind@localhost:5432/meetingmind',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
};
// Used by TypeORM CLI for migrations
exports.default = new typeorm_1.DataSource(exports.dataSourceOptions);
//# sourceMappingURL=data-source.js.map