import { MeetingAnalysisService } from '../meetings/analysis/meeting-analysis.service';
export declare class HealthController {
    private readonly meetingAnalysisService;
    constructor(meetingAnalysisService: MeetingAnalysisService);
    check(): {
        status: string;
        timestamp: string;
    };
    llmStatus(): {
        provider: string;
        model: string;
        geminiConfigured: boolean;
    };
}
//# sourceMappingURL=health.controller.d.ts.map