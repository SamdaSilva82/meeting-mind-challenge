import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getApiEnvFilePaths } from './config/api-env';
import { HealthModule } from './health/health.module';
import { MeetingsModule } from './meetings/meetings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: getApiEnvFilePaths(),
    }),
    HealthModule,
    MeetingsModule,
  ],
})
export class AppModule {}
