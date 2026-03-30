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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
let MeetingsService = class MeetingsService {
    /** In-memory store keyed by meeting id (process lifetime only). */
    meetings = new Map();
    constructor() {
        this.seedFromSampleData();
    }
    createMeeting(request, analysis) {
        const meeting = {
            id: (0, node_crypto_1.randomUUID)(),
            title: request.title,
            date: request.date,
            transcript: request.transcript,
            createdAt: new Date().toISOString(),
            analysis,
        };
        this.meetings.set(meeting.id, meeting);
        return meeting;
    }
    getMeetings() {
        return Array.from(this.meetings.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    getMeetingById(id) {
        const meeting = this.meetings.get(id);
        if (!meeting) {
            throw new common_1.NotFoundException(`Meeting with id "${id}" not found.`);
        }
        return meeting;
    }
    updateMeeting(id, request, analysis) {
        const existing = this.getMeetingById(id);
        const updated = {
            ...existing,
            title: request.title,
            date: request.date,
            transcript: request.transcript,
            analysis,
        };
        this.meetings.set(id, updated);
        return updated;
    }
    seedFromSampleData() {
        if (this.meetings.size > 0) {
            return;
        }
        const sampleDataDir = (0, node_path_1.join)(process.cwd(), '..', '..', 'sample-data');
        let files = [];
        try {
            files = (0, node_fs_1.readdirSync)(sampleDataDir);
        }
        catch {
            return;
        }
        const supported = files.filter((f) => f.endsWith('.json') || f.endsWith('.md'));
        for (const file of supported) {
            const path = (0, node_path_1.join)(sampleDataDir, file);
            try {
                const raw = (0, node_fs_1.readFileSync)(path, 'utf8');
                if (file.endsWith('.json')) {
                    const parsed = JSON.parse(raw);
                    if (parsed.title && parsed.date && parsed.transcript) {
                        const analysis = parsed.analysis ?? {
                            summary: 'Seeded meeting from JSON sample data.',
                            actionItems: [],
                            decisions: [],
                            openQuestions: [],
                        };
                        this.createMeeting({
                            title: parsed.title,
                            date: parsed.date,
                            transcript: parsed.transcript,
                        }, analysis);
                    }
                    continue;
                }
                const seeded = this.parseMarkdownMeeting(raw, file);
                if (seeded) {
                    this.createMeeting(seeded.request, seeded.analysis);
                }
            }
            catch {
                // Ignore malformed sample file and continue seeding others.
            }
        }
    }
    parseMarkdownMeeting(markdown, filename) {
        const titleMatch = markdown.match(/^#\s+(.+)$/m);
        const dateMatch = markdown.match(/\*\*Date:\*\*\s*(.+)$/m);
        const title = titleMatch?.[1]?.trim() || filename.replace(/\.(md|json)$/i, '');
        const date = this.toIsoDate(dateMatch?.[1]?.trim());
        if (!title || !date) {
            return null;
        }
        const transcript = markdown.trim();
        const sentencePreview = transcript
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 3)
            .join(' ');
        const actionItems = Array.from(transcript.matchAll(/\b([A-Z][a-z]+)\s+(?:will|can|should)\s+([^.!?]+)[.!?]?/g))
            .slice(0, 5)
            .map((m) => ({
            assignee: m[1],
            description: m[2].trim(),
        }));
        const decisions = Array.from(transcript.matchAll(/\b(decision\s+\w+|decided to|agreed to)\s+([^.!?]+)[.!?]?/gi))
            .slice(0, 5)
            .map((m) => m[1].toLowerCase().includes('decision')
            ? `${m[1]} ${m[2]}`.trim()
            : `Team ${m[1].toLowerCase()} ${m[2]}`.trim());
        const openQuestions = transcript
            .split(/(?<=[?])\s+/)
            .map((q) => q.trim())
            .filter((q) => q.endsWith('?'))
            .slice(0, 5);
        return {
            request: {
                title,
                date,
                transcript,
            },
            analysis: {
                summary: sentencePreview || `Seeded transcript for ${title}.`,
                actionItems: actionItems.length > 0
                    ? actionItems
                    : [{ description: 'Review transcript highlights.', assignee: 'Unassigned' }],
                decisions: decisions.length > 0 ? decisions : ['No explicit final decision captured.'],
                openQuestions: openQuestions.length > 0
                    ? openQuestions
                    : ['What follow-up items should be prioritized next?'],
            },
        };
    }
    toIsoDate(input) {
        if (!input) {
            return null;
        }
        const parsed = Date.parse(input);
        if (!Number.isNaN(parsed)) {
            return new Date(parsed).toISOString().slice(0, 10);
        }
        return null;
    }
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map