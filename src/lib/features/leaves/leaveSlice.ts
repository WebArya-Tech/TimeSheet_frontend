import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason: string;
}

interface Holiday {
  id: string;
  holiday_name: string;
  holiday_date: string;
}

interface LeaveState {
  myLeaves: LeaveRequest[];
  holidays: Holiday[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  myLeaves: [],
  holidays: [],
  loading: false,
  error: null,
};

export const fetchMyLeaves = createAsyncThunk(
  'leaves/fetchMyLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves/my');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch leaves');
    }
  }
);

export const fetchHolidays = createAsyncThunk(
  'leaves/fetchHolidays',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/holidays');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch holidays');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.holidays = action.payload;
      });
  },
});

export default leaveSlice.reducer;
