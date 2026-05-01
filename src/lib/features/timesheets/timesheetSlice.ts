import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface TimesheetHeader {
  id: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  status: string;
}

interface TimesheetState {
  currentWeek: TimesheetHeader | null;
  recentEntries: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TimesheetState = {
  currentWeek: null,
  recentEntries: [],
  loading: false,
  error: null,
};

export const fetchCurrentWeek = createAsyncThunk(
  'timesheets/fetchCurrentWeek',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/timesheets/week-current');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch current week');
    }
  }
);

export const fetchRecentEntries = createAsyncThunk(
  'timesheets/fetchRecentEntries',
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      const response = await api.get(`/timesheets/history/me?limit=${limit}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch recent entries');
    }
  }
);

const timesheetSlice = createSlice({
  name: 'timesheets',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentWeek.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentWeek.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWeek = action.payload;
      })
      .addCase(fetchRecentEntries.fulfilled, (state, action) => {
        state.recentEntries = action.payload;
      });
  },
});

export default timesheetSlice.reducer;
