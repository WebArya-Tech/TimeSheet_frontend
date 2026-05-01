import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchCurrentWeek, fetchRecentEntries } from "@/lib/features/timesheets/timesheetSlice";
import { fetchTodayStatus, fetchAttendanceSummary } from "@/lib/features/attendance/attendanceSlice";
import { fetchNotifications } from "@/lib/features/notifications/notificationSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressRing from "@/components/ProgressRing";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import ReportDownloadPanel from "@/components/ReportDownloadPanel";
import { Zap, CalendarDays, Clock, ArrowRight, AlertCircle, FileText } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const weeklyTrend = [
  { week: "W1", hours: 38 }, { week: "W2", hours: 40 }, { week: "W3", hours: 36 },
  { week: "W4", hours: 42 }, { week: "W5", hours: 40 }, { week: "W6", hours: 26 },
];

const projectDist = [
  { name: "Project Alpha", value: 14, color: "hsl(var(--primary))" },
  { name: "Client Portal", value: 8, color: "hsl(var(--info))" },
  { name: "Meetings", value: 3, color: "hsl(var(--warning))" },
  { name: "Training", value: 1, color: "hsl(var(--success))" },
];

const dailyData = [
  { day: "Mon", hours: 8, target: 8 },
  { day: "Tue", hours: 7.5, target: 8 },
  { day: "Wed", hours: 8, target: 8 },
  { day: "Thu", hours: 6, target: 8 },
  { day: "Fri", hours: 0, target: 8 },
];

const UserDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { currentWeek, recentEntries } = useAppSelector((state) => state.timesheets);
  const { todayStatus, summary: attendanceSummary } = useAppSelector((state) => state.attendance);
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCurrentWeek());
    dispatch(fetchRecentEntries(5));
    dispatch(fetchTodayStatus());
    dispatch(fetchAttendanceSummary());
    dispatch(fetchNotifications());
  }, [dispatch]);

  const weekHours = currentWeek?.total_hours || 0;
  const weekTarget = 40;
  const weekPct = Math.min(100, Math.round((weekHours / weekTarget) * 100));

  const formatWeekRange = (start?: string, end?: string) => {
    if (!start || !end) return "Current Week";
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${e.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="page-header">Good morning, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="page-subheader">Week: {formatWeekRange(currentWeek?.week_start, currentWeek?.week_end)} · {user?.employeeCode} · {user?.department || "General"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/daily-entry")} className="gap-2 gradient-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25">
            <Zap className="h-4 w-4" /> Log Time Now
          </Button>
          <Button variant="outline" onClick={() => navigate("/weekly-submission")} className="gap-2 rounded-xl">
            <CalendarDays className="h-4 w-4" /> Weekly Summary
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Attendance" value={todayStatus?.status ? todayStatus.status.replace(/-/g, ' ') : 'No record'} subtitle={`${todayStatus?.check_in || '—'} → ${todayStatus?.check_out || '—'}`} icon={Clock} color="primary" />
        <StatCard title="Week Total" value={weekHours} subtitle={`of ${weekTarget} expected`} icon={CalendarDays} color="info" />
        <StatCard title="Attendance Summary" value={attendanceSummary?.days_present ?? 0} subtitle={`${attendanceSummary?.days_absent ?? 0} absent · ${attendanceSummary?.days_leave ?? 0} leave`} icon={AlertCircle} color="warning" />
        <StatCard title="Notifications" value={unreadCount} subtitle="Unread alerts" icon={FileText} color="success" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="section-card lg:col-span-2 card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Weekly Hours Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="userHoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" fill="url(#userHoursGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="section-card card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Time Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={projectDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                  {projectDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {projectDist.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] font-medium text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week bar chart + progress ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="section-card lg:col-span-2 card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">This Week at a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 sm:gap-3 h-[140px]">
              {dailyData.map((d) => {
                const maxH = 120;
                const barH = d.target > 0 ? (d.hours / d.target) * maxH : 0;
                const isToday = d.day === "Thu";
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-foreground">{d.hours > 0 ? `${d.hours}h` : "–"}</span>
                    <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: maxH }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-muted rounded-t-lg" style={{ height: maxH }} />
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-500 ${isToday ? "gradient-primary shadow-lg shadow-primary/20" : "bg-primary/20"}`}
                        style={{ height: Math.max(barH, 0) }}
                      />
                    </div>
                    <span className={`text-[11px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Weekly Status</span>
                <StatusBadge status={currentWeek?.status || "Draft"} />
              </div>
              <span className="text-sm font-semibold text-foreground">{weekHours} / {weekTarget} hours</span>
            </div>
          </CardContent>
        </Card>

        <Card className="section-card card-hover flex flex-col items-center justify-center">
          <CardContent className="pt-6 flex flex-col items-center gap-3">
            <ProgressRing progress={weekPct} size={120} strokeWidth={8}>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-foreground">{weekPct}%</p>
                <p className="text-[10px] text-muted-foreground font-medium">COMPLETED</p>
              </div>
            </ProgressRing>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground">{weekHours}h logged</p>
              <p className="text-xs text-muted-foreground">{weekTarget - weekHours}h remaining this week</p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 rounded-xl gap-1 w-full" onClick={() => navigate("/weekly-submission")}>
              Submit Week <ArrowRight className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent entries + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="section-card lg:col-span-2 card-hover">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Recent Entries</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className="gap-1 text-xs text-primary">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2.5 text-left rounded-l-lg">Date</th>
                    <th className="px-3 py-2.5 text-left">Project/Activity</th>
                    <th className="px-3 py-2.5 text-left">Task</th>
                    <th className="px-3 py-2.5 text-right rounded-r-lg">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentEntries.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No recent entries</td></tr>
                  ) : (
                    recentEntries.map((e, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${e.entry_type === "Project" ? "bg-primary" : "bg-warning"}`} />
                            <span className="font-medium">{e.project_name || e.category_name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{e.task}</td>
                        <td className="px-3 py-3 text-right font-bold">{e.hours}h</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="section-card card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Notifications</CardTitle>
              {unreadCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">{unreadCount}</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No notifications</p>
            ) : (
              notifications.slice(0, 3).map((n, i) => (
                <div key={i} className={`flex gap-3 rounded-xl p-3 transition-all ${!n.is_read ? "bg-primary/5 border border-primary/10" : "bg-muted/30"}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${!n.is_read ? "gradient-primary shadow" : "bg-muted"}`}>
                    <FileText className={`h-3.5 w-3.5 ${!n.is_read ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground leading-snug">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ReportDownloadPanel title="Download Daily/Weekly/Monthly Reports" />
    </div>
  );
};

export default UserDashboard;
