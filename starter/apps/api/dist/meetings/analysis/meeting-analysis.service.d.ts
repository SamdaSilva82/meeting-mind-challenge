import { ConfigService } from '@nestjs/config';
import { MeetingAnalysis } from '@meeting-mind/shared';
export declare const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export declare class MeetingAnalysisService {
    private readonly config;
    private readonly logger;
    private readonly model;
    private readonly gemini;
    constructor(config: ConfigService);
    getRuntimeInfo(): {
        provider: string;
        model: string;
        geminiConfigured: boolean;
    };
    analyzeTranscript(title: string, date: string, transcript: string): Promise<MeetingAnalysis>;
    private buildGeminiPrompt;
    private extractJsonObject;
    private errorType;
    private errorMessage;
}
//# sourceMappingURL=meeting-analysis.service.d.ts.map