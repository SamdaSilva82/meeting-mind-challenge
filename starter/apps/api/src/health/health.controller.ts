import { Controller, Get } from '@nestjs/common';
import { MeetingAnalysisService } from '../meetings/analysis/meeting-analysis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly meetingAnalysisService: MeetingAnalysisService,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('llm')
  llmStatus() {
    return this.meetingAnalysisService.getRuntimeInfo();
  }
}
