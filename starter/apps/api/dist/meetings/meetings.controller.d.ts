import { CreateMeetingRequest, MeetingRecord } from '@meeting-mind/shared';
import { MeetingAnalysisService } from './analysis/meeting-analysis.service';
import { MeetingsService } from './meetings.service';
export declare class MeetingsController {
    private readonly meetingAnalysisService;
    private readonly meetingsService;
    private readonly logger;
    constructor(meetingAnalysisService: MeetingAnalysisService, meetingsService: MeetingsService);
    private validateMeetingInput;
    createMeeting(body: Partial<CreateMeetingRequest>): Promise<MeetingRecord>;
    updateMeeting(id: string, body: Partial<CreateMeetingRequest>): Promise<MeetingRecord>;
    getMeetings(): MeetingRecord[];
    getMeetingById(id: string): MeetingRecord;
}
//# sourceMappingURL=meetings.controller.d.ts.map