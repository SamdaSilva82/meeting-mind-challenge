/**
 * Shared types for Meeting Mind.
 *
 * Add your shared interfaces and types here.
 * Both the API and web app can import from "@meeting-mind/shared".
 */

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface MeetingActionItem {
  description: string;
  assignee: string;
}

export interface MeetingAnalysis {
  summary: string;
  actionItems: MeetingActionItem[];
  decisions: string[];
  openQuestions: string[];
}

export interface CreateMeetingRequest {
  title: string;
  date: string;
  transcript: string;
}

export interface MeetingRecord extends CreateMeetingRequest {
  id: string;
  createdAt: string;
  analysis: MeetingAnalysis;
}
