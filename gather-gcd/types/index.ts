// Time slot types
export type SlotType = "morning" | "afternoon" | "evening";

export interface TimeSlot {
  date: string; // ISO date string (yyyy-MM-dd)
  slot: SlotType;
}

// Event types
export interface Event {
  id: string;
  title: string;
  passcode: string;
  start_date: string;
  creator_token: string;
  is_locked: boolean;
  final_slot: TimeSlot | null;
  created_at: string;
  expires_at: string;
}

export interface EventResponse {
  id: number;
  event_id: string;
  nickname: string;
  user_fingerprint: string;
  availability: Record<string, SlotType[]>; // { "2024-01-15": ["morning", "afternoon"] }
  updated_at: string;
}

// Heatmap data
export interface HeatmapSlot {
  slot_date: string;
  slot_type: SlotType;
  participant_count: number;
  names: string[];
}

// API request/response types
export interface CreateEventRequest {
  title: string;
  start_date: string;
}

export interface CreateEventResponse {
  id: string;
  passcode: string;
  creator_token: string;
}

export interface VerifyPasscodeRequest {
  passcode: string;
}

export interface VerifyPasscodeResponse {
  valid: boolean;
  event?: Event;
}

export interface SubmitResponseRequest {
  event_id: string;
  nickname: string;
  user_fingerprint: string;
  availability: Record<string, SlotType[]>;
}

export interface LockEventRequest {
  creator_token: string;
  final_slot?: TimeSlot;
}

// User session (stored in localStorage)
export interface UserSession {
  nickname: string;
  user_fingerprint: string;
  creator_tokens: Record<string, string>; // { eventId: creatorToken }
}
