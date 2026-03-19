export interface ClassifyRequest {
  complaint_text: string;
  user_id?: number;
}

export interface ClassifyResponse {
  complaint_id: number | null;
  category: string;
  confidence: number;
  explanation: string;
  // Advanced intelligence fields (v2)
  severity: 'High' | 'Medium' | 'Low';
  priority: 'P1' | 'P2' | 'P3';
  severity_reason: string;
  recommended_action: 'auto_send' | 'review_required' | 'escalate';
  auto_send_eligible: boolean;
  routing_reason: string;
  response_status: 'pending' | 'auto_sent' | 'approved' | 'escalated' | 'overridden';
  auto_response_sent: boolean;
  delivery_mode: 'pending' | 'simulate' | 'smtp';
}

export interface ComplaintDetail {
  id: number;
  complaint_text: string;
  user_email?: string | null;
  category: string | null;
  confidence: number | null;
  explanation: string | null;
  severity?: 'High' | 'Medium' | 'Low' | null;
  priority?: 'P1' | 'P2' | 'P3' | null;
  recommended_action?: 'auto_send' | 'review_required' | 'escalate' | null;
  response_status?: 'pending' | 'auto_sent' | 'approved' | 'escalated' | 'overridden' | null;
  draft_response_text?: string | null;
  final_response_text?: string | null;
  sent_to_email?: string | null;
  delivery_mode?: 'pending' | 'simulate' | 'smtp' | null;
  auto_sent_at?: string | null;
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
  response_status?: 'pending' | 'auto_sent' | 'approved' | 'escalated' | 'overridden' | null;
  sent_to_email?: string | null;
  delivery_mode?: 'pending' | 'simulate' | 'smtp' | null;
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

export interface SendReplyRequest {
  message: string;
}

export interface SendReplyResponse {
  message: string;
  response_status: 'approved' | 'overridden';
  delivery_mode: 'simulate' | 'smtp';
  sent_to_email: string;
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
  // Advanced intelligence fields (v2 — may be absent on older records)
  severity?: 'High' | 'Medium' | 'Low' | null;
  priority?: 'P1' | 'P2' | 'P3' | null;
  recommended_action?: 'auto_send' | 'review_required' | 'escalate' | null;
  response_status?: 'pending' | 'auto_sent' | 'approved' | 'escalated' | 'overridden' | null;
  sent_to_email?: string | null;
  delivery_mode?: 'pending' | 'simulate' | 'smtp' | null;
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
  // Advanced intelligence KPIs (v2)
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
  auto_send_count: number;
  review_required_count: number;
  escalated_count: number;
}
