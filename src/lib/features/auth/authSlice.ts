import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/axios';
import type { UserRole } from '@/contexts/auth-types';

export interface User {
  id: string;
  email: string;
  name: string;
  employeeCode: string;
  role: UserRole;
  status: string;
  department?: string;
  designation?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

export const fetchUser = createAsyncThunk('auth/fetchUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/users/me');
    const u = response.data as any;
    const roleName: string | undefined = u?.role?.role_name;
    const mappedRole: UserRole =
      roleName === 'SUPER_ADMIN' ? 'super_admin' :
      roleName === 'ADMIN' ? 'admin' :
      'user';

    const mapped: User = {
      id: String(u?.id ?? ''),
      email: String(u?.email ?? ''),
      name: String(u?.full_name ?? ''),
      employeeCode: String(u?.employee_code ?? ''),
      role: mappedRole,
      status: String(u?.status ?? 'Active'),
      // Backend does not currently provide these; keep optional for UI.
      department: u?.department ? String(u.department) : undefined,
      designation: u?.designation ? String(u.designation) : undefined,
    };
    return mapped;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch user');
  }
});

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: any, { dispatch, rejectWithValue }) => {
    try {
      const body = new URLSearchParams();
      body.set('username', credentials.email);
      body.set('password', credentials.password);

      const response = await api.post('/auth/login', body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Fetch user profile immediately after login
      await dispatch(fetchUser()).unwrap();

      return access_token;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    console.error('Logout error context', e);
  } finally {
    localStorage.removeItem('token');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    forcedLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch User
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(fetchUser.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        // If fetchUser fails (like 401), we should probably clear auth
        state.user = null;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem('token');
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, forcedLogout } = authSlice.actions;
export default authSlice.reducer;
