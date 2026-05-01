import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
}

interface AttendanceSummary {
  week_start: string;
  week_end: string;
  total_hours: number;
  days_present: number;
  days_absent: number;
  days_leave: number;
  days_late: number;
}

interface AttendanceState {
  todayStatus: AttendanceRecord | null;
  history: AttendanceRecord[];
  summary: AttendanceSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceState = {
  todayStatus: null,
  history: [],
  summary: null,
  loading: false,
  error: null,
};

export const fetchTodayStatus = createAsyncThunk(
  'attendance/fetchToday',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendances/today');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch today status');
    }
  }
);

export const fetchAttendanceHistory = createAsyncThunk(
  'attendance/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendances/my');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch attendance history');
    }
  }
);

export const fetchAttendanceSummary = createAsyncThunk(
  'attendance/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendances/weekly-summary');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch attendance summary');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayStatus.fulfilled, (state, action) => {
        state.todayStatus = action.payload;
      })
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(fetchAttendanceSummary.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export default attendanceSlice.reducer;
