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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MeetingsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsController = void 0;
const common_1 = require("@nestjs/common");
const meeting_analysis_service_1 = require("./analysis/meeting-analysis.service");
const meetings_service_1 = require("./meetings.service");
let MeetingsController = MeetingsController_1 = class MeetingsController {
    meetingAnalysisService;
    meetingsService;
    logger = new common_1.Logger(MeetingsController_1.name);
    constructor(meetingAnalysisService, meetingsService) {
        this.meetingAnalysisService = meetingAnalysisService;
        this.meetingsService = meetingsService;
    }
    validateMeetingInput(body) {
        if (body === null || body === undefined || typeof body !== 'object') {
            throw new common_1.BadRequestException('Request body must be a JSON object.');
        }
        const title = body.title?.trim();
        const date = body.date?.trim();
        const transcript = body.transcript?.trim();
        if (!title || !date || !transcript) {
            throw new common_1.BadRequestException('title, date, and transcript are required string fields.');
        }
        if (Number.isNaN(Date.parse(date))) {
            throw new common_1.BadRequestException('date must be a valid date string.');
        }
        return { title, date, transcript };
    }
    async createMeeting(body) {
        const { title, date, transcript } = this.validateMeetingInput(body);
        try {
            const analysis = await this.meetingAnalysisService.analyzeTranscript(title, date, transcript);
            return this.meetingsService.createMeeting({ title, date, transcript }, analysis);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                const status = error.getStatus();
                if (status === common_1.HttpStatus.TOO_MANY_REQUESTS) {
                    this.logger.warn('POST /meetings: Gemini quota/rate limit (429) — client should show retry guidance.');
                }
                else if (status === common_1.HttpStatus.SERVICE_UNAVAILABLE) {
                    this.logger.warn('POST /meetings: analysis unavailable (503) — likely missing GOOGLE_API_KEY.');
                }
                else if (status === common_1.HttpStatus.UNAUTHORIZED) {
                    this.logger.warn('POST /meetings: LLM provider rejected API key (401).');
                }
                else if (status === common_1.HttpStatus.BAD_GATEWAY) {
                    this.logger.warn('POST /meetings: upstream AI error (502) — see API logs.');
                }
                else if (status === common_1.HttpStatus.BAD_REQUEST) {
                    /* validation; avoid noise */
                }
                else if (status >= 500) {
                    this.logger.error(`POST /meetings: unexpected ${status}`);
                }
                throw error;
            }
            this.logger.error('POST /meetings: unexpected non-HTTP failure', error instanceof Error ? error.stack : String(error));
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Could not create the meeting. Please try again. If the problem continues, contact support.',
                error: 'Internal Server Error',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateMeeting(id, body) {
        const { title, date, transcript } = this.validateMeetingInput(body);
        const existing = this.meetingsService.getMeetingById(id);
        try {
            let analysis = existing.analysis;
            if (existing.transcript !== transcript) {
                analysis = await this.meetingAnalysisService.analyzeTranscript(title, date, transcript);
            }
            return this.meetingsService.updateMeeting(id, { title, date, transcript }, analysis);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error('PUT /meetings/:id: unexpected non-HTTP failure', error instanceof Error ? error.stack : String(error));
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Could not update the meeting. Please try again. If the problem continues, contact support.',
                error: 'Internal Server Error',
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getMeetings() {
        return this.meetingsService.getMeetings();
    }
    getMeetingById(id) {
        return this.meetingsService.getMeetingById(id);
    }
};
exports.MeetingsController = MeetingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "createMeeting", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeetingsController.prototype, "updateMeeting", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], MeetingsController.prototype, "getMeetings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], MeetingsController.prototype, "getMeetingById", null);
exports.MeetingsController = MeetingsController = MeetingsController_1 = __decorate([
    (0, common_1.Controller)('meetings'),
    __metadata("design:paramtypes", [meeting_analysis_service_1.MeetingAnalysisService,
        meetings_service_1.MeetingsService])
], MeetingsController);
//# sourceMappingURL=meetings.controller.js.map