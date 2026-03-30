import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateMeetingRequest,
  MeetingAnalysis,
  MeetingRecord,
} from '@meeting-mind/shared';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class MeetingsService {
  /** In-memory store keyed by meeting id (process lifetime only). */
  private readonly meetings = new Map<string, MeetingRecord>();

  constructor() {
    this.seedFromSampleData();
  }

  createMeeting(
    request: CreateMeetingRequest,
    analysis: MeetingAnalysis,
  ): MeetingRecord {
    const meeting: MeetingRecord = {
      id: randomUUID(),
      title: request.title,
      date: request.date,
      transcript: request.transcript,
      createdAt: new Date().toISOString(),
      analysis,
    };

    this.meetings.set(meeting.id, meeting);
    return meeting;
  }

  getMeetings(): MeetingRecord[] {
    return Array.from(this.meetings.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  getMeetingById(id: string): MeetingRecord {
    const meeting = this.meetings.get(id);
    if (!meeting) {
      throw new NotFoundException(`Meeting with id "${id}" not found.`);
    }
    return meeting;
  }

  updateMeeting(
    id: string,
    request: CreateMeetingRequest,
    analysis: MeetingAnalysis,
  ): MeetingRecord {
    const existing = this.getMeetingById(id);
    const updated: MeetingRecord = {
      ...existing,
      title: request.title,
      date: request.date,
      transcript: request.transcript,
      analysis,
    };
    this.meetings.set(id, updated);
    return updated;
  }

  private seedFromSampleData() {
    if (this.meetings.size > 0) {
      return;
    }

    const sampleDataDir = join(process.cwd(), '..', '..', 'sample-data');
    let files: string[] = [];
    try {
      files = readdirSync(sampleDataDir);
    } catch {
      return;
    }

    const supported = files.filter(
      (f) => f.endsWith('.json') || f.endsWith('.md'),
    );

    for (const file of supported) {
      const path = join(sampleDataDir, file);
      try {
        const raw = readFileSync(path, 'utf8');
        if (file.endsWith('.json')) {
          const parsed = JSON.parse(raw) as Partial<MeetingRecord>;
          if (parsed.title && parsed.date && parsed.transcript) {
            const analysis: MeetingAnalysis = parsed.analysis ?? {
              summary: 'Seeded meeting from JSON sample data.',
              actionItems: [],
              decisions: [],
              openQuestions: [],
            };
            this.createMeeting(
              {
                title: parsed.title,
                date: parsed.date,
                transcript: parsed.transcript,
              },
              analysis,
            );
          }
          continue;
        }

        const seeded = this.parseMarkdownMeeting(raw, file);
        if (seeded) {
          this.createMeeting(seeded.request, seeded.analysis);
        }
      } catch {
        // Ignore malformed sample file and continue seeding others.
      }
    }
  }

  private parseMarkdownMeeting(
    markdown: string,
    filename: string,
  ): { request: CreateMeetingRequest; analysis: MeetingAnalysis } | null {
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

    const actionItems = Array.from(
      transcript.matchAll(/\b([A-Z][a-z]+)\s+(?:will|can|should)\s+([^.!?]+)[.!?]?/g),
    )
      .slice(0, 5)
      .map((m) => ({
        assignee: m[1],
        description: m[2].trim(),
      }));

    const decisions = Array.from(
      transcript.matchAll(/\b(decision\s+\w+|decided to|agreed to)\s+([^.!?]+)[.!?]?/gi),
    )
      .slice(0, 5)
      .map((m) =>
        m[1].toLowerCase().includes('decision')
          ? `${m[1]} ${m[2]}`.trim()
          : `Team ${m[1].toLowerCase()} ${m[2]}`.trim(),
      );

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
        actionItems:
          actionItems.length > 0
            ? actionItems
            : [{ description: 'Review transcript highlights.', assignee: 'Unassigned' }],
        decisions:
          decisions.length > 0 ? decisions : ['No explicit final decision captured.'],
        openQuestions:
          openQuestions.length > 0
            ? openQuestions
            : ['What follow-up items should be prioritized next?'],
      },
    };
  }

  private toIsoDate(input?: string): string | null {
    if (!input) {
      return null;
    }
    const parsed = Date.parse(input);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
    return null;
  }
}
