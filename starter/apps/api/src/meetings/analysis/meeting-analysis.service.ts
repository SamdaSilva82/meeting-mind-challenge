import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeetingAnalysis } from '@meeting-mind/shared';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { z, ZodError } from 'zod';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const MeetingAnalysisSchema = z.object({
  summary: z
    .string()
    .min(1, 'Summary is required.')
    .describe('A concise summary of what happened in the meeting.'),
  actionItems: z
    .array(
      z.object({
        description: z
          .string()
          .min(1, 'Action item description is required.')
          .describe('Clear action item description.'),
        assignee: z
          .string()
          .min(1, 'Action item assignee is required.')
          .describe(
            'The person responsible. Use "Unassigned" when not explicit.',
          ),
      }),
    )
    .describe('Concrete follow-up tasks from the meeting.'),
  decisions: z
    .array(z.string().min(1))
    .describe('Final decisions that were explicitly made.'),
  openQuestions: z
    .array(z.string().min(1))
    .describe('Outstanding questions that still need answers.'),
});

@Injectable()
export class MeetingAnalysisService {
  private readonly logger = new Logger(MeetingAnalysisService.name);
  private readonly model: string;
  private readonly gemini: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    this.model =
      this.config.get<string>('GEMINI_MODEL')?.trim() ??
      this.config.get<string>('OPENAI_MODEL')?.trim() ??
      DEFAULT_GEMINI_MODEL;

    const apiKey =
      this.config.get<string>('GOOGLE_API_KEY')?.trim() ??
      this.config.get<string>('GOOGLE_AI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Google Gemini API key is missing. Set GOOGLE_API_KEY (preferred) or GOOGLE_AI_API_KEY in .env.',
      );
    }
    this.gemini = new GoogleGenerativeAI(apiKey);

    this.logger.log(
      `Meeting analysis provider=gemini, model=${this.model}`,
    );
  }

  getRuntimeInfo(): {
    provider: string;
    model: string;
    geminiConfigured: boolean;
  } {
    return {
      provider: 'gemini',
      model: this.model,
      geminiConfigured: true,
    };
  }

  async analyzeTranscript(
    title: string,
    date: string,
    transcript: string,
  ): Promise<MeetingAnalysis> {
    try {
      const model = this.gemini.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: this.buildGeminiPrompt(title, date, transcript) }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              required: ['summary', 'actionItems', 'decisions', 'openQuestions'],
              properties: {
                summary: { type: SchemaType.STRING },
                actionItems: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    required: ['description', 'assignee'],
                    properties: {
                      description: { type: SchemaType.STRING },
                      assignee: { type: SchemaType.STRING },
                    },
                  },
                },
                decisions: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
                openQuestions: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                },
              },
            },
          },
        },
      );
      const rawText = result.response.text();
      const parsedJson = this.extractJsonObject(rawText);
      const structured = MeetingAnalysisSchema.parse(parsedJson);
      return structured;
    } catch (error) {
      const message = this.errorMessage(error);
      this.logger.error(
        `Gemini analysis error; type=${this.errorType(error)} message=${message}`,
      );
      const lower = message.toLowerCase();

      if (lower.includes('api key') || lower.includes('unauthorized')) {
        throw new HttpException(
          'Gemini API key is invalid or unauthorized.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (lower.includes('quota') || lower.includes('429') || lower.includes('rate')) {
        throw new HttpException(
          'Gemini quota or rate limit exceeded. Please check billing or retry shortly.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (lower.includes('safety') || lower.includes('blocked')) {
        throw new HttpException(
          'Gemini content safety blocked this transcript. Please revise and retry.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      if (error instanceof ZodError || lower.includes('json')) {
        throw new BadGatewayException(
          'Gemini returned an invalid structured response format.',
        );
      }
      throw new BadGatewayException(
        'Gemini meeting analysis failed unexpectedly.',
      );
    }
  }

  private buildGeminiPrompt(
    title: string,
    date: string,
    transcript: string,
  ): string {
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

  private extractJsonObject(raw: string): unknown {
    const text = raw.trim();
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('Gemini response does not contain JSON');
      }
      return JSON.parse(match[0]);
    }
  }

  private errorType(error: unknown): string {
    if (error instanceof Error) {
      return error.name;
    }
    return 'UnknownError';
  }

  private errorMessage(error: unknown): string {
    if (error instanceof ZodError) {
      return `Invalid JSON shape: ${error.message}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
