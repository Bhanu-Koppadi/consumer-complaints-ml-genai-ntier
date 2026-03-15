export interface ClassifyRequest {
  complaint_text: string;
  user_id?: number;
}

export interface ClassifyResponse {
  complaint_id: number | null;
  category: string;
  confidence: number;
  explanation: string;
}

export interface ComplaintDetail {
  id: number;
  complaint_text: string;
  category: string | null;
  confidence: number | null;
  explanation: string | null;
  created_at: string | null;
  classified_at: string | null;
}

export interface SubmitComplaintRequest {
  complaint_text: string;
  user_id?: number;
}

export interface SubmitComplaintResponse {
  message: string;
  id: number;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
}

export interface ComplaintHistoryItem {
  id: number;
  complaint_text: string;
  category: string | null;
  confidence: number | null;
  created_at: string | null;
}

export interface ComplaintHistoryResponse {
  complaints: ComplaintHistoryItem[];
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: UserProfile;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: UserProfile;
}

export interface ApiError {
  error: string;
  details?: string;
}

// Draft response (GenAI)
export interface DraftResponseResponse {
  draft_response: string;
}

// Admin (all users' complaints)
export interface AdminComplaintItem {
  id: number;
  user_id?: number | null;
  submitted_by_username?: string | null;
  complaint_text: string;
  category: string | null;
  confidence: number | null;
  created_at: string | null;
}

export interface AdminComplaintsResponse {
  total: number;
  page: number;
  limit: number;
  complaints: AdminComplaintItem[];
}

export interface AdminStatisticsResponse {
  total_complaints: number;
  by_category: Record<string, number>;
  average_confidence: number;
  low_confidence_count: number;
  date_range: { start: string | null; end: string | null };
}
