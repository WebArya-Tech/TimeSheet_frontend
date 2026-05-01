import { useNavigate } from "react-router-dom";
import StatCard from "@/components/StatCard";
import ProgressRing from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, Shield, FolderKanban, CheckSquare, Settings, FileText, ArrowRight, BarChart3, Tag, CalendarDays, Clock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { CardHeader, CardTitle } from "@/components/ui/card";
import ReportDownloadPanel from "@/components/ReportDownloadPanel";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useEffect } from "react";
import { fetchDashboardStats } from "@/lib/features/dashboard/dashboardSlice";
import api from "@/lib/axios";

const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))"];

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading && !stats) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  const compliancePct = stats?.compliance_pct || 0;
  const projectEffort = stats?.project_effort || [];
  const weeklyTrend = stats?.weekly_trend || [];
  const userDist = [
    { name: "Active Users", value: stats?.total_users || 0, color: "hsl(var(--primary))" },
    { name: "Projects", value: stats?.active_projects || 0, color: "hsl(var(--info))" },
  ];

  const panels = [
    { title: "User Management", desc: "Manage employees & roles", icon: Users, path: "/users", color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Project Controls", desc: "Configure active projects", icon: FolderKanban, path: "/projects", color: "text-info", bgColor: "bg-info/10" },
    { title: "System Approvals", desc: "Review pending submissions", icon: CheckSquare, path: "/approvals", color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Attendance Review", desc: "Approve daily attendance records", icon: Clock, path: "/attendance-approvals", color: "text-secondary", bgColor: "bg-secondary/10" },
    { title: "Holiday Calendar", desc: "Set regional holidays", icon: CalendarDays, path: "/holidays", color: "text-success", bgColor: "bg-success/10" },
    { title: "Category Settings", desc: "Task & leave categories", icon: Tag, path: "/categories", color: "text-info", bgColor: "bg-info/10" },
    { title: "Governance Audit", desc: "System-wide activity logs", icon: Shield, path: "/audit", color: "text-destructive", bgColor: "bg-destructive/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Super Admin Console ⚡</h1>
          <p className="page-subheader mt-1">System governance and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/settings")} className="gap-2 rounded-xl">
            <Settings className="h-4 w-4" /> Settings
          </Button>
          <Button variant="outline" onClick={() => navigate("/audit")} className="gap-2 rounded-xl">
            <FileText className="h-4 w-4" /> Audit Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Users" value={stats?.total_users || 0} icon={Users} color="primary" />
        <StatCard title="Active Projects" value={stats?.active_projects || 0} icon={FolderKanban} color="info" />
        <StatCard title="Pending Approvals" value={stats?.pending_approvals || 0} subtitle="Across all admins" icon={CheckSquare} color="warning" />
        <StatCard title="Compliance" value={`${compliancePct}%`} subtitle="Weekly submission rate" icon={Shield} color="success" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="section-card lg:col-span-2 card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Project-wise Hours (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectEffort} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="section-card card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">User Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={userDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4}>
                  {userDist.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {userDist.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] font-medium text-muted-foreground">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance trend + panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="section-card card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Submission Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyTrend}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Line type="monotone" dataKey="submitted" stroke="hsl(var(--success))" strokeWidth={2.5} dot={{ fill: "hsl(var(--success))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="section-card lg:col-span-2 card-hover">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ProgressRing progress={compliancePct} size={110} strokeWidth={9}>
                <div className="text-center">
                  <p className="text-xl font-extrabold">{compliancePct}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight">System Compliance</p>
                </div>
              </ProgressRing>
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-bold">System Health Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Users", value: String(stats?.total_users || 0), sub: "Active" },
                    { label: "Projects", value: String(stats?.active_projects || 0), sub: "Active" },
                    { label: "This Week", value: `${stats?.submitted_this_week || 0}/${stats?.total_users || 0}`, sub: "Submitted" },
                    { label: "Avg Compliance", value: `${compliancePct}%`, sub: "Recent" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted/30 border border-border/50 p-3 text-center">
                      <p className="text-lg font-extrabold text-foreground">{s.value}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {panels.map((item) => (
          <Card key={item.path} className="section-card cursor-pointer card-hover group" onClick={() => navigate(item.path)}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.bgColor} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportDownloadPanel title="Download Daily/Weekly/Monthly Reports" />
    </div>
  );
};

export default SuperAdminDashboard;


