import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import dashboardReducer from './features/dashboard/dashboardSlice';
import userReducer from './features/users/userSlice';
import projectReducer from './features/projects/projectSlice';
import attendanceReducer from './features/attendance/attendanceSlice';
import leaveReducer from './features/leaves/leaveSlice';
import notificationReducer from './features/notifications/notificationSlice';
import timesheetReducer from './features/timesheets/timesheetSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    users: userReducer,
    projects: projectReducer,
    attendance: attendanceReducer,
    leaves: leaveReducer,
    notifications: notificationReducer,
    timesheets: timesheetReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
