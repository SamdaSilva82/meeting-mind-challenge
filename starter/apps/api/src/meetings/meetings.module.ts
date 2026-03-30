import { Module } from '@nestjs/common';
import { MeetingAnalysisService } from './analysis/meeting-analysis.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingAnalysisService],
  exports: [MeetingAnalysisService],
})
export class MeetingsModule {}
