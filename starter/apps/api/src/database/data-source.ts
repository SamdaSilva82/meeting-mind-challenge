import { loadApiEnvFiles } from '../config/api-env';
import { DataSource, DataSourceOptions } from 'typeorm';

loadApiEnvFiles();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgres://meetingmind:meetingmind@localhost:5432/meetingmind',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
};

// Used by TypeORM CLI for migrations
export default new DataSource(dataSourceOptions);
