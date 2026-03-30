"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MeetingAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingAnalysisService = exports.DEFAULT_GEMINI_MODEL = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const zod_1 = require("zod");
exports.DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const MeetingAnalysisSchema = zod_1.z.object({
    summary: zod_1.z
        .string()
        .min(1, 'Summary is required.')
        .describe('A concise summary of what happened in the meeting.'),
    actionItems: zod_1.z
        .array(zod_1.z.object({
        description: zod_1.z
            .string()
            .min(1, 'Action item description is required.')
            .describe('Clear action item description.'),
        assignee: zod_1.z
            .string()
            .min(1, 'Action item assignee is required.')
            .describe('The person responsible. Use "Unassigned" when not explicit.'),
    }))
        .describe('Concrete follow-up tasks from the meeting.'),
    decisions: zod_1.z
        .array(zod_1.z.string().min(1))
        .describe('Final decisions that were explicitly made.'),
    openQuestions: zod_1.z
        .array(zod_1.z.string().min(1))
        .describe('Outstanding questions that still need answers.'),
});
let MeetingAnalysisService = MeetingAnalysisService_1 = class MeetingAnalysisService {
    config;
    logger = new common_1.Logger(MeetingAnalysisService_1.name);
    model;
    gemini;
    constructor(config) {
        this.config = config;
        this.model =
            this.config.get('GEMINI_MODEL')?.trim() ??
                this.config.get('OPENAI_MODEL')?.trim() ??
                exports.DEFAULT_GEMINI_MODEL;
        const apiKey = this.config.get('GOOGLE_API_KEY')?.trim() ??
            this.config.get('GOOGLE_AI_API_KEY')?.trim();
        if (!apiKey) {
            throw new common_1.ServiceUnavailableException('Google Gemini API key is missing. Set GOOGLE_API_KEY (preferred) or GOOGLE_AI_API_KEY in .env.');
        }
        this.gemini = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.logger.log(`Meeting analysis provider=gemini, model=${this.model}`);
    }
    getRuntimeInfo() {
        return {
            provider: 'gemini',
            model: this.model,
            geminiConfigured: true,
        };
    }
    async analyzeTranscript(title, date, transcript) {
        try {
            const model = this.gemini.getGenerativeModel({ model: this.model });
            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: this.buildGeminiPrompt(title, date, transcript) }],
                    },
                ],
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: generative_ai_1.SchemaType.OBJECT,
                        required: ['summary', 'actionItems', 'decisions', 'openQuestions'],
                        properties: {
                            summary: { type: generative_ai_1.SchemaType.STRING },
                            actionItems: {
                                type: generative_ai_1.SchemaType.ARRAY,
                                items: {
                                    type: generative_ai_1.SchemaType.OBJECT,
                                    required: ['description', 'assignee'],
                                    properties: {
                                        description: { type: generative_ai_1.SchemaType.STRING },
                                        assignee: { type: generative_ai_1.SchemaType.STRING },
                                    },
                                },
                            },
                            decisions: {
                                type: generative_ai_1.SchemaType.ARRAY,
                                items: { type: generative_ai_1.SchemaType.STRING },
                            },
                            openQuestions: {
                                type: generative_ai_1.SchemaType.ARRAY,
                                items: { type: generative_ai_1.SchemaType.STRING },
                            },
                        },
                    },
                },
            });
            const rawText = result.response.text();
            const parsedJson = this.extractJsonObject(rawText);
            const structured = MeetingAnalysisSchema.parse(parsedJson);
            return structured;
        }
        catch (error) {
            const message = this.errorMessage(error);
            this.logger.error(`Gemini analysis error; type=${this.errorType(error)} message=${message}`);
            const lower = message.toLowerCase();
            if (lower.includes('api key') || lower.includes('unauthorized')) {
                throw new common_1.HttpException('Gemini API key is invalid or unauthorized.', common_1.HttpStatus.UNAUTHORIZED);
            }
            if (lower.includes('quota') || lower.includes('429') || lower.includes('rate')) {
                throw new common_1.HttpException('Gemini quota or rate limit exceeded. Please check billing or retry shortly.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            if (lower.includes('safety') || lower.includes('blocked')) {
                throw new common_1.HttpException('Gemini content safety blocked this transcript. Please revise and retry.', common_1.HttpStatus.UNPROCESSABLE_ENTITY);
            }
            if (error instanceof zod_1.ZodError || lower.includes('json')) {
                throw new common_1.BadGatewayException('Gemini returned an invalid structured response format.');
            }
            throw new common_1.BadGatewayException('Gemini meeting analysis failed unexpectedly.');
        }
    }
    buildGeminiPrompt(title, date, transcript) {
        return [
            'You are a senior meeting analyst for product and engineering teams.',
            'Extract concise and accurate meeting notes for execution.',
            'Return ONLY valid JSON with this exact schema:',
            '{"summary": string, "actionItems": [{"description": string, "assignee": string}], "decisions": string[], "openQuestions": string[]}',
            'Do not wrap in markdown.',
            'Rules:',
            '- Keep summary to 2-4 clear sentences.',
            '- Include only actionable, specific action items.',
            '- Use "Unassigned" if no clear owner is given.',
            '- Capture explicit decisions only.',
            '- Capture unresolved open questions only.',
            '',
            `Meeting title: ${title}`,
            `Meeting date: ${date}`,
            '',
            'Transcript:',
            transcript,
        ].join('\n');
    }
    extractJsonObject(raw) {
        const text = raw.trim();
        try {
            return JSON.parse(text);
        }
        catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) {
                throw new Error('Gemini response does not contain JSON');
            }
            return JSON.parse(match[0]);
        }
    }
    errorType(error) {
        if (error instanceof Error) {
            return error.name;
        }
        return 'UnknownError';
    }
    errorMessage(error) {
        if (error instanceof zod_1.ZodError) {
            return `Invalid JSON shape: ${error.message}`;
        }
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
};
exports.MeetingAnalysisService = MeetingAnalysisService;
exports.MeetingAnalysisService = MeetingAnalysisService = MeetingAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MeetingAnalysisService);
//# sourceMappingURL=meeting-analysis.service.js.map