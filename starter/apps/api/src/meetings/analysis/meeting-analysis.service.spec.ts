import { BadGatewayException, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MeetingAnalysis } from '@meeting-mind/shared';
import { MeetingAnalysisService } from './meeting-analysis.service';

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
    SchemaType: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING',
    },
  };
});

function loadSample(relativeFile: string): string {
  // Handle both repo-root and apps/api execution contexts.
  const candidates = [
    join(process.cwd(), '..', '..', '..', 'sample-data', relativeFile),
    join(process.cwd(), '..', '..', 'sample-data', relativeFile),
  ];
  for (const path of candidates) {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      // Continue trying other candidate locations.
    }
  }
  throw new Error(`Could not load sample transcript: ${relativeFile}`);
}

function sentenceCount(text: string): number {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function expectMeetingAnalysisShape(result: MeetingAnalysis): void {
  expect(result).toEqual(
    expect.objectContaining({
      summary: expect.any(String),
      actionItems: expect.any(Array),
      decisions: expect.any(Array),
      openQuestions: expect.any(Array),
    }),
  );
  expect(result.summary.trim().length).toBeGreaterThan(0);
  expect(sentenceCount(result.summary)).toBeGreaterThanOrEqual(2);
  expect(sentenceCount(result.summary)).toBeLessThanOrEqual(4);
  expect(Array.isArray(result.actionItems)).toBe(true);
  expect(Array.isArray(result.decisions)).toBe(true);
  expect(Array.isArray(result.openQuestions)).toBe(true);
}

function setupGeminiResponse(transcript: string): MeetingAnalysis {
  if (transcript.trim().length === 0) {
    throw new Error('Transcript is empty');
  }

  if (transcript.includes('Smart Notifications Feature')) {
    return {
      summary:
        'The team scoped a V1 for smart notifications focused on priorities, digest mode, and quiet hours. They decided to keep the first release limited to in-app and email channels, use global preferences, and keep real-time as the default with digest opt-in. Engineering and design dependencies were clarified with clear implementation direction.',
      actionItems: [
        {
          description:
            'Write a technical design doc for queue architecture and digest scheduling by end of week.',
          assignee: 'Marcus',
        },
        {
          description:
            'Provide frontend effort estimate for notification settings and tab layout updates.',
          assignee: 'Priya',
        },
      ],
      decisions: [
        'V1 includes in-app and email notifications; push is deferred.',
        'Notification preferences will be global in V1 (no per-project overrides).',
        'Real-time remains default while digest mode is opt-in.',
      ],
      openQuestions: [
        'Should contextual digest nudges be included in V1 or V1.1?',
        'What exact rollout timeline should be committed for backend queue infrastructure?',
      ],
    };
  }

  if (transcript.includes('REST to GraphQL Migration')) {
    return {
      summary:
        'The architecture review aligned on an incremental GraphQL migration for read-heavy views while keeping REST for writes. The team agreed to start with the project overview behind a feature flag and measure performance before scaling rollout. Operational concerns around complexity limits, auth, and caching conventions were discussed and accepted with guardrails.',
      actionItems: [
        {
          description:
            'Start schema design and phase-one GraphQL server implementation with complexity analysis.',
          assignee: 'Marcus',
        },
        {
          description:
            'Run a frontend spike to validate Apollo with hybrid WebSocket updates.',
          assignee: 'Priya',
        },
      ],
      decisions: [
        'Adopt incremental migration with project overview as phase one.',
        'Use feature flags and compare REST vs GraphQL latency before full rollout.',
      ],
      openQuestions: [
        'Should GraphQL subscriptions be introduced early or deferred after initial rollout?',
        'What query conventions will be enforced to maximize cache consistency?',
      ],
    };
  }

  if (transcript.includes('Sprint 14 Retrospective')) {
    return {
      summary:
        'The retrospective focused on incident response gaps and planning discipline after a production outage tied to connection pool exhaustion. The team acknowledged documentation and alerting weaknesses while also highlighting successful feature delivery due to strong upfront alignment. They agreed on concrete reliability and process improvements for the upcoming sprint.',
      actionItems: [
        {
          description: 'Implement proper connection pooling with PgBouncer as top priority.',
          assignee: 'Marcus',
        },
        {
          description: 'Schedule a team runbook-writing day within two weeks.',
          assignee: 'Priya',
        },
      ],
      decisions: [
        'Connection pool remediation is top priority in the next sprint.',
        'Large customer onboarding alerts should be posted 48 hours in advance.',
      ],
      openQuestions: [
        'Should the team formally adopt 80% sprint capacity planning?',
        'Can the on-call model shift to primary/secondary coverage?',
      ],
    };
  }

  if (transcript.includes('Sarah will finalize')) {
    return {
      summary:
        'The team discussed a focused planning update with specific ownership and timeline commitments. Key implementation and review tasks were assigned directly.',
      actionItems: [
        { description: 'Finalize architecture notes by Friday.', assignee: 'Sarah' },
        { description: 'Review API contract updates this week.', assignee: 'Marcus' },
      ],
      decisions: ['Proceed with implementation and review this sprint.'],
      openQuestions: ['Do we need additional QA support before release?'],
    };
  }

  return {
    summary:
      'A short meeting occurred and the team captured concise notes with at least one follow-up.',
    actionItems: [{ description: 'Follow up on discussed item.', assignee: 'Unassigned' }],
    decisions: ['Continue with the agreed next step.'],
    openQuestions: ['Is any additional context needed to proceed?'],
  };
}

describe('MeetingAnalysisService', () => {
  let service: MeetingAnalysisService;

  const productPlanning = loadSample('product-planning.md');
  const technicalReview = loadSample('technical-review.md');
  const teamRetro = loadSample('team-retrospective.md');

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent.mockImplementation(async (request: unknown) => {
      const req = request as { contents?: Array<{ parts?: Array<{ text?: string }> }> };
      const prompt = req.contents?.[0]?.parts?.[0]?.text ?? '';
      const transcript = prompt.split('\nTranscript:\n')[1] ?? '';
      const analysis = setupGeminiResponse(transcript);
      return {
        response: {
          text: () => JSON.stringify(analysis),
        },
      };
    });

    const configService = {
      get: (key: string) => {
        if (key === 'GOOGLE_API_KEY') return 'test-key';
        if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
        return undefined;
      },
    } as ConfigService;

    service = new MeetingAnalysisService(configService);
  });

  it('analyzes product-planning sample and returns meaningful structured output', async () => {
    const result = await service.analyzeTranscript(
      'Smart Notifications Feature — Product Planning',
      '2025-03-11',
      productPlanning,
    );

    expectMeetingAnalysisShape(result);
    expect(result.actionItems.length).toBeGreaterThan(0);
    expect(result.decisions.length).toBeGreaterThan(0);
    expect(result.openQuestions.length).toBeGreaterThan(0);
    expect(result.actionItems.some((a) => /Marcus|Priya/.test(a.assignee))).toBe(true);
    expect(result.summary.toLowerCase()).not.toContain('mock');
    expect(result.summary.toLowerCase()).not.toContain('fallback');
  });

  it('analyzes technical-review sample and extracts architecture decisions and open questions', async () => {
    const result = await service.analyzeTranscript(
      'API Architecture Review — REST to GraphQL Migration',
      '2025-03-18',
      technicalReview,
    );

    expectMeetingAnalysisShape(result);
    expect(result.decisions.join(' ').toLowerCase()).toContain('feature flag');
    expect(result.actionItems.some((a) => /Marcus|Priya/.test(a.assignee))).toBe(true);
    expect(result.openQuestions.length).toBeGreaterThan(0);
    expect(result.summary.toLowerCase()).not.toContain('mock');
    expect(result.summary.toLowerCase()).not.toContain('fallback');
  });

  it('analyzes team-retrospective sample and captures reliability follow-ups', async () => {
    const result = await service.analyzeTranscript(
      'Sprint 14 Retrospective',
      '2025-03-07',
      teamRetro,
    );

    expectMeetingAnalysisShape(result);
    expect(result.actionItems.some((a) => a.description.toLowerCase().includes('pgbouncer'))).toBe(true);
    expect(result.decisions.join(' ').toLowerCase()).toContain('priority');
    expect(result.openQuestions.length).toBeGreaterThan(0);
    expect(result.summary.toLowerCase()).not.toContain('mock');
    expect(result.summary.toLowerCase()).not.toContain('fallback');
  });

  it('throws a clear error path when transcript is empty', async () => {
    await expect(
      service.analyzeTranscript('Empty meeting', '2025-03-01', ''),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('returns valid structured analysis for very short transcript', async () => {
    const result = await service.analyzeTranscript(
      'Short sync',
      '2025-03-02',
      'Quick sync. Ship it tomorrow.',
    );

    expectMeetingAnalysisShape(result);
    expect(result.actionItems.length).toBeGreaterThan(0);
  });

  it('detects assignees when names are explicitly mentioned', async () => {
    const transcript =
      'Sarah will finalize architecture notes by Friday. Marcus will review API changes tomorrow.';
    const result = await service.analyzeTranscript(
      'Assignee detection',
      '2025-03-03',
      transcript,
    );

    expectMeetingAnalysisShape(result);
    const assignees = result.actionItems.map((a) => a.assignee);
    expect(assignees).toContain('Sarah');
    expect(assignees).toContain('Marcus');
  });

  it('maps quota/rate provider errors to HTTP 429', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 rate limit exceeded'));

    await expect(
      service.analyzeTranscript('Rate test', '2025-03-01', 'Any transcript'),
    ).rejects.toMatchObject<HttpException>({ status: 429 });
  });
});
