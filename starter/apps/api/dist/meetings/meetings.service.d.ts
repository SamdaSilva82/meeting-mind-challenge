import { CreateMeetingRequest, MeetingAnalysis, MeetingRecord } from '@meeting-mind/shared';
export declare class MeetingsService {
    /** In-memory store keyed by meeting id (process lifetime only). */
    private readonly meetings;
    constructor();
    createMeeting(request: CreateMeetingRequest, analysis: MeetingAnalysis): MeetingRecord;
    getMeetings(): MeetingRecord[];
    getMeetingById(id: string): MeetingRecord;
    updateMeeting(id: string, request: CreateMeetingRequest, analysis: MeetingAnalysis): MeetingRecord;
    private seedFromSampleData;
    private parseMarkdownMeeting;
    private toIsoDate;
}
//# sourceMappingURL=meetings.service.d.ts.map