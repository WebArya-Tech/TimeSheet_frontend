import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { fetchUser } from "@/lib/features/auth/authSlice";
import { useEffect } from "react";
import { ThemeProvider } from "@/contexts/useTheme";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DailyTimesheet from "@/pages/DailyTimesheet";
import WeeklySubmission from "@/pages/WeeklySubmission";
import TimesheetHistory from "@/pages/TimesheetHistory";
import Projects from "@/pages/Projects";
import Assignments from "@/pages/Assignments";
import Approvals from "@/pages/Approvals";
import LeaveApprovals from "@/pages/LeaveApprovals";
import AttendanceApprovals from "@/pages/AttendanceApprovals";
import TeamTimesheets from "@/pages/TeamTimesheets";
import UserManagement from "@/pages/UserManagement";
import CategoriesHolidays from "@/pages/CategoriesHolidays";
import Reports from "@/pages/Reports";
import SettingsAudit from "@/pages/SettingsAudit";
import Notifications from "@/pages/Notifications";
import AttendanceCalendar from "@/pages/AttendanceCalendar";
import Profile from "@/pages/Profile";
import LeaveManagement from "@/pages/LeaveManagement";
import OrgView from "@/pages/OrgView";
import GlobalActivityView from "@/pages/GlobalActivityView";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user, token } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (token && !user && !isLoading) {
      dispatch(fetchUser());
    }
  }, [dispatch, token, user, isLoading]);

  if (!isAuthenticated && !token) return <Navigate to="/login" replace />;
  if (isLoading || (token && !user)) return <div>Loading...</div>;

  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const isAuth = isAuthenticated || !!token;

  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={isAuth ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendanceCalendar /></ProtectedRoute>} />
      <Route path="/leaves" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/daily-entry" element={<ProtectedRoute><DailyTimesheet /></ProtectedRoute>} />
      <Route path="/weekly-submission" element={<ProtectedRoute><WeeklySubmission /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><TimesheetHistory /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
      <Route path="/leave-approvals" element={<ProtectedRoute><LeaveApprovals /></ProtectedRoute>} />
      <Route path="/attendance-approvals" element={<ProtectedRoute><AttendanceApprovals /></ProtectedRoute>} />
      <Route path="/team-timesheets" element={<ProtectedRoute><TeamTimesheets /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/admins" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><CategoriesHolidays /></ProtectedRoute>} />
      <Route path="/holidays" element={<ProtectedRoute><CategoriesHolidays /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsAudit /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><SettingsAudit /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/org-view" element={<ProtectedRoute><OrgView /></ProtectedRoute>} />
      <Route path="/global-activity" element={<ProtectedRoute><GlobalActivityView /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;

