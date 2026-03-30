import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateMeetingRequest, MeetingRecord } from '@meeting-mind/shared';
import { MeetingAnalysisService } from './analysis/meeting-analysis.service';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
  private readonly logger = new Logger(MeetingsController.name);

  constructor(
    private readonly meetingAnalysisService: MeetingAnalysisService,
    private readonly meetingsService: MeetingsService,
  ) {}

  private validateMeetingInput(body: Partial<CreateMeetingRequest>) {
    if (body === null || body === undefined || typeof body !== 'object') {
      throw new BadRequestException('Request body must be a JSON object.');
    }

    const title = body.title?.trim();
    const date = body.date?.trim();
    const transcript = body.transcript?.trim();

    if (!title || !date || !transcript) {
      throw new BadRequestException(
        'title, date, and transcript are required string fields.',
      );
    }

    if (Number.isNaN(Date.parse(date))) {
      throw new BadRequestException('date must be a valid date string.');
    }

    return { title, date, transcript };
  }

  @Post()
  async createMeeting(
    @Body() body: Partial<CreateMeetingRequest>,
  ): Promise<MeetingRecord> {
    const { title, date, transcript } = this.validateMeetingInput(body);

    try {
      const analysis = await this.meetingAnalysisService.analyzeTranscript(
        title,
        date,
        transcript,
      );
      return this.meetingsService.createMeeting(
        { title, date, transcript },
        analysis,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        const status = error.getStatus();
        if (status === HttpStatus.TOO_MANY_REQUESTS) {
          this.logger.warn(
            'POST /meetings: Gemini quota/rate limit (429) — client should show retry guidance.',
          );
        } else if (status === HttpStatus.SERVICE_UNAVAILABLE) {
          this.logger.warn(
            'POST /meetings: analysis unavailable (503) — likely missing GOOGLE_API_KEY.',
          );
        } else if (status === HttpStatus.UNAUTHORIZED) {
          this.logger.warn(
            'POST /meetings: LLM provider rejected API key (401).',
          );
        } else if (status === HttpStatus.BAD_GATEWAY) {
          this.logger.warn(
            'POST /meetings: upstream AI error (502) — see API logs.',
          );
        } else if (status === HttpStatus.BAD_REQUEST) {
          /* validation; avoid noise */
        } else if (status >= 500) {
          this.logger.error(`POST /meetings: unexpected ${status}`);
        }
        throw error;
      }

      this.logger.error(
        'POST /meetings: unexpected non-HTTP failure',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            'Could not create the meeting. Please try again. If the problem continues, contact support.',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateMeeting(
    @Param('id') id: string,
    @Body() body: Partial<CreateMeetingRequest>,
  ): Promise<MeetingRecord> {
    const { title, date, transcript } = this.validateMeetingInput(body);
    const existing = this.meetingsService.getMeetingById(id);

    try {
      let analysis = existing.analysis;
      if (existing.transcript !== transcript) {
        analysis = await this.meetingAnalysisService.analyzeTranscript(
          title,
          date,
          transcript,
        );
      }
      return this.meetingsService.updateMeeting(
        id,
        { title, date, transcript },
        analysis,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'PUT /meetings/:id: unexpected non-HTTP failure',
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            'Could not update the meeting. Please try again. If the problem continues, contact support.',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  getMeetings(): MeetingRecord[] {
    return this.meetingsService.getMeetings();
  }

  @Get(':id')
  getMeetingById(@Param('id') id: string): MeetingRecord {
    return this.meetingsService.getMeetingById(id);
  }
}
