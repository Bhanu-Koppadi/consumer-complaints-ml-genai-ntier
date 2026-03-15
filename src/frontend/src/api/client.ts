/// <reference types="vite/client" />

import axios from 'axios';
import type {
  AdminComplaintsResponse,
  AdminStatisticsResponse,
  ClassifyRequest,
  ClassifyResponse,
  ComplaintDetail,
  ComplaintHistoryResponse,
  DraftResponseResponse,
  HealthResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SubmitComplaintRequest,
  SubmitComplaintResponse,
  UserProfile,
} from '../types/api';

const TOKEN_KEY = 'cc_access_token';
let inMemoryToken: string | null = null;

/**
 * Production hardening: do not persist JWT in Web Storage by default.
 * This avoids long-lived token exposure through XSS.
 */
function shouldUsePersistentTokenStorage(): boolean {
  return (
    import.meta.env.DEV &&
    import.meta.env.VITE_ALLOW_INSECURE_TOKEN_STORAGE === 'true'
  );
}

export function getToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }

  if (!shouldUsePersistentTokenStorage()) {
    return null;
  }

  try {
    const persistedToken = localStorage.getItem(TOKEN_KEY);
    if (persistedToken) {
      inMemoryToken = persistedToken;
    }
    return persistedToken;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  inMemoryToken = token;

  if (!shouldUsePersistentTokenStorage()) {
    return;
  }

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage failures (e.g., private mode restrictions).
  }
}

export function removeToken(): void {
  inMemoryToken = null;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function classifyComplaint(
  payload: ClassifyRequest
): Promise<ClassifyResponse> {
  const response = await apiClient.post<ClassifyResponse>(
    '/api/classify',
    payload
  );
  return response.data;
}

export async function submitComplaint(
  payload: SubmitComplaintRequest
): Promise<SubmitComplaintResponse> {
  const response = await apiClient.post<SubmitComplaintResponse>(
    '/api/complaints',
    payload
  );
  return response.data;
}

export async function getComplaintById(
  id: number
): Promise<ComplaintDetail> {
  const response = await apiClient.get<ComplaintDetail>(
    `/api/complaints/${id}`
  );
  return response.data;
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}

export async function getComplaintHistory(): Promise<ComplaintHistoryResponse> {
  const response = await apiClient.get<ComplaintHistoryResponse>('/api/complaints');
  return response.data;
}

export async function draftResponse(
  complaint_text: string,
  category: string,
  confidence: number
): Promise<DraftResponseResponse> {
  const response = await apiClient.post<DraftResponseResponse>(
    '/api/draft-response',
    { complaint_text, category, confidence }
  );
  return response.data;
}

export async function getAdminComplaints(
  page: number,
  limit: number,
  category?: string | null,
  min_confidence?: number | null
): Promise<AdminComplaintsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category != null && category !== '') params.set('category', category);
  if (min_confidence != null) params.set('min_confidence', String(min_confidence));
  const response = await apiClient.get<AdminComplaintsResponse>(
    `/api/admin/complaints?${params.toString()}`
  );
  return response.data;
}

export async function getAdminStatistics(): Promise<AdminStatisticsResponse> {
  const response = await apiClient.get<AdminStatisticsResponse>('/api/admin/statistics');
  return response.data;
}

// Auth API — private implementations, exported as a namespace object.
// Token persistence is handled by the Redux authSlice; do not call setToken here.
async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
  return response.data;
}

async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/api/auth/register', data);
  return response.data;
}

function logout(): void {
  removeToken();
}

export const authApi = { login, register, logout };

/**
 * Decodes the JWT payload to reconstruct the UserProfile without a network
 * round-trip. The backend embeds `sub` (username), `role` and `user_id` in
 * the token claims. Falls back gracefully if any field is missing.
 */
export function getProfile(token: string): UserProfile {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as Record<string, unknown>;
    return {
      id: typeof payload['user_id'] === 'number' ? payload['user_id'] : 0,
      username: typeof payload['sub'] === 'string' ? payload['sub'] : 'unknown',
      email: typeof payload['email'] === 'string' ? payload['email'] : '',
      role: (payload['role'] === 'USER' || payload['role'] === 'ADMIN') ? payload['role'] : 'USER',
    };
  } catch {
    throw new Error('Unable to decode access token');
  }
}

// Re-export ClassifyResponse as ClassificationResult for consumers that previously
// imported it from complaintsApi.ts (consolidated into this module).
export type { ClassifyResponse as ClassificationResult } from '../types/api';
