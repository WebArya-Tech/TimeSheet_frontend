import { useNavigate } from "react-router-dom";
import StatCard from "@/components/StatCard";
import ProgressRing from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import {
  CheckSquare, Users, FolderKanban, AlertTriangle, Clock, ArrowRight, TrendingUp, Zap, CalendarDays, ChevronRight, FileText
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import ReportDownloadPanel from "@/components/ReportDownloadPanel";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useEffect, useState } from "react";
import { fetchDashboardStats } from "@/lib/features/dashboard/dashboardSlice";
import api from "@/lib/axios";

// Chart color palette
const COLORS = ["hsl(var(--primary))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { stats, loading } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [counts, setCounts] = useState({ timesheets: 0, attendance: 0, leaves: 0 });

  useEffect(() => {
    dispatch(fetchDashboardStats());

    // Fetch specific pending items and counts
    Promise.all([
      api.get("/approvals/pending"),
      api.get("/attendances/pending"),
      api.get("/leaves/pending")
    ]).then(([timesheets, attendance, leaves]) => {
      const tList = Array.isArray(timesheets.data) ? timesheets.data : [];
      const aList = Array.isArray(attendance.data) ? attendance.data : [];
      const lList = Array.isArray(leaves.data) ? leaves.data : [];
      
      setPendingList(tList.slice(0, 5));
      setCounts({
        timesheets: tList.length,
        attendance: aList.length,
        leaves: lList.length
      });
    }).catch(() => { });
  }, [dispatch]);

  if (loading && !stats) return <div className="flex h-[400px] items-center justify-center text-muted-foreground animate-pulse">Loading dashboard summary...</div>;

  const compliancePct = stats?.compliance_pct || 0;
  const teamHours = stats?.team_utilization || [];
  const projectEffort = stats?.project_effort || [];
  const weeklyTrend = stats?.weekly_trend || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="page-header text-gradient">Admin Dashboard</h1>
          <p className="page-subheader">System Overview · {user?.name} · Manager Panel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/approvals")} className="gap-2 gradient-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/25 border-none">
            <CheckSquare className="h-4 w-4" /> Review Approvals
          </Button>
          <Button onClick={() => navigate("/attendance-approvals")} className="gap-2 rounded-xl bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 border-none">
            <Clock className="h-4 w-4" /> Attendance Review
          </Button>
          <Button variant="outline" onClick={() => navigate("/projects")} className="gap-2 rounded-xl backdrop-blur-sm bg-background/50">
            <FolderKanban className="h-4 w-4" /> Manage Projects
          </Button>
        </div>
      </div>

      {/* Stats Grid - Fixed Responsiveness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Pending" 
          value={counts.timesheets + counts.attendance + counts.leaves} 
          subtitle={`${counts.timesheets} T · ${counts.attendance} A · ${counts.leaves} L`} 
          icon={CheckSquare} 
          color="warning" 
        />
        <StatCard title="Team Members" value={stats?.total_users || 0} subtitle="Active resources" icon={Users} color="info" />
        <StatCard title="Active Projects" value={stats?.active_projects || 0} subtitle="System-wide" icon={FolderKanban} color="primary" />
        <StatCard title="Compliance Rate" value={`${compliancePct}%`} subtitle="This week's submissions" icon={AlertTriangle} color="success" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Utilization Bar - Custom Style */}
        <Card className="section-card lg:col-span-2 card-hover overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Team Utilization (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {teamHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={teamHours} barSize={32} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 500 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.4)' }} contentStyle={{ borderRadius: 12, border: "none", background: "hsl(var(--card))", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground bg-muted/10 rounded-xl border border-dashed">No utilization data for this week</div>
            )}
          </CardContent>
        </Card>

        {/* Project Effort Pie */}
        <Card className="section-card card-hover overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-info" />
              Project Effort Split
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-6">
            {projectEffort.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={projectEffort} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={5}>
                      {projectEffort.map((d, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={4} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", background: "hsl(var(--card))", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                  {projectEffort.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] font-semibold text-foreground truncate uppercase tracking-tight">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground bg-muted/10 rounded-xl border border-dashed w-full">No project effort data for this month</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission Trend */}
        <Card className="section-card lg:col-span-2 card-hover">
          <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-success" />
              Submission Trend (Last 6 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="adminSubGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", background: "hsl(var(--card))", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                <Area type="monotone" dataKey="submitted" stroke="hsl(var(--primary))" fill="url(#adminSubGrad)" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "white" }} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Circular Compliance Progress */}
        <Card className="section-card card-hover flex flex-col items-center justify-center pt-6">
          <CardContent className="flex flex-col items-center gap-4 w-full">
            <ProgressRing progress={compliancePct} size={130} strokeWidth={10}>
              <div className="text-center">
                <p className="text-3xl font-black text-foreground tracking-tighter">{compliancePct}%</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Goal: 100%</p>
              </div>
            </ProgressRing>
            <div className="w-full space-y-3 mt-2">
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-muted-foreground font-medium">Submissions:</span>
                <span className="font-bold text-foreground">{stats?.submitted_this_week || 0} / {stats?.total_users || 0}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-primary" style={{ width: `${compliancePct}%` }} />
              </div>
              <p className="text-[10px] text-center text-muted-foreground font-medium italic">
                {compliancePct < 100 ? `${stats?.total_users! - stats?.submitted_this_week!} team members pending` : "All timesheets submitted!"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Table-Style List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="section-card lg:col-span-2 card-hover overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Pending Timesheets ({counts.timesheets})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/approvals")} className="gap-1 text-xs text-primary font-bold hover:bg-primary/5">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="table-header border-none">
                    <th className="px-6 py-4 text-left font-bold text-foreground/80">User</th>
                    <th className="px-6 py-4 text-left font-bold text-foreground/80">Period</th>
                    <th className="px-6 py-4 text-center font-bold text-foreground/80">Hours</th>
                    <th className="px-6 py-4 text-right pr-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pendingList.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-muted-foreground font-medium">No pending timesheets</td></tr>
                  ) : (
                    pendingList.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/10 transition-colors group cursor-pointer" onClick={() => navigate("/approvals")}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-[12px] font-black text-primary-foreground shadow-sm">
                              {(item.full_name || "U").split(" ").filter(Boolean).map((n: string) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="text-sm font-bold group-hover:text-primary transition-colors">{item.full_name}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">{item.employee_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-foreground">
                            {new Date(item.week_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – {new Date(item.week_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-primary">
                          {item.total_hours}h
                        </td>
                        <td className="px-6 py-4 text-right pr-8">
                          <div className="flex justify-end">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-all">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="section-card card-hover overflow-hidden">
          <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
            <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-between h-auto py-3 px-4 rounded-xl hover:bg-warning/5 hover:border-warning/30 transition-all group"
              onClick={() => navigate("/attendance-approvals")}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Attendance Approvals</p>
                  <p className="text-[10px] text-muted-foreground">{counts.attendance} pending review</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-between h-auto py-3 px-4 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all group"
              onClick={() => navigate("/leave-approvals")}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Leave Approvals</p>
                  <p className="text-[10px] text-muted-foreground">{counts.leaves} pending review</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-between h-auto py-3 px-4 rounded-xl hover:bg-info/5 hover:border-info/30 transition-all group"
              onClick={() => navigate("/reports")}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Generate Reports</p>
                  <p className="text-[10px] text-muted-foreground">Download team insights</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {[
          { label: "Team Timesheets", icon: Users, path: "/team-timesheets", color: "text-primary", bgColor: "bg-primary/10" },
          { label: "Assignments", icon: Zap, path: "/assignments", color: "text-info", bgColor: "bg-info/10" },
          { label: "Reports Hub", icon: TrendingUp, path: "/reports", color: "text-success", bgColor: "bg-success/10" },
          { label: "Staff Directory", icon: Users, path: "/users", color: "text-warning", bgColor: "bg-warning/10" },
        ].map((item) => (
          <Card key={item.path} className="section-card cursor-pointer card-hover group" onClick={() => navigate(item.path)}>
            <CardContent className="flex flex-col items-center justify-center gap-3 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <p className="text-sm font-bold text-center tracking-tight">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReportDownloadPanel title="System-Wide Performance Reports" />
    </div>
  );
};

export default AdminDashboard;


