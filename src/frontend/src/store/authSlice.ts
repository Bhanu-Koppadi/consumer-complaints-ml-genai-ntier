import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi, getToken, setToken, removeToken, getProfile } from '../api/client';
import type { LoginRequest, RegisterRequest, UserProfile } from '../types/api';

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: getToken(),
  isAuthenticated: false,
  loading: false,
  error: null,
};

/**
 * Restores a session from localStorage by decoding the stored access token
 * (JWT decode — no network round-trip required).
 */
export const bootstrapSession = createAsyncThunk<
  { user: UserProfile; token: string },
  void,
  { rejectValue: string }
>('auth/bootstrapSession', async (_, { rejectWithValue }) => {
  const token = getToken();
  if (!token) return rejectWithValue('No token stored');
  try {
    const user = getProfile(token);
    return { user, token };
  } catch {
    removeToken();
    return rejectWithValue('Session expired or invalid');
  }
});

export const loginUser = createAsyncThunk<
  { user: UserProfile; token: string },
  LoginRequest,
  { rejectValue: string }
>('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.login(credentials);
    setToken(response.access_token);
    return { token: response.access_token, user: response.user };
  } catch (err: unknown) {
    return rejectWithValue(err instanceof Error ? err.message : 'Login failed');
  }
});

export const registerUser = createAsyncThunk<
  { user: UserProfile; token: string },
  RegisterRequest,
  { rejectValue: string }
>('auth/registerUser', async (data, { rejectWithValue }) => {
  try {
    await authApi.register(data);
    const response = await authApi.login({ username: data.username, password: data.password });
    setToken(response.access_token);
    return { token: response.access_token, user: response.user };
  } catch (err: unknown) {
    return rejectWithValue(err instanceof Error ? err.message : 'Registration failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: UserProfile; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      setToken(action.payload.token);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      authApi.logout();
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.user = null;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'An unexpected error occurred';
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'An unexpected error occurred';
      });
  },
});

export const { setCredentials, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
