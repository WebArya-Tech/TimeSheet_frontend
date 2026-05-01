import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, Users, FolderKanban, Clock, AlertTriangle, TrendingUp, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { downloadReport, type ReportFormat, type ReportPeriod } from "@/lib/reportDownloads";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchUsers } from "@/lib/features/users/userSlice";
import { fetchProjects } from "@/lib/features/projects/projectSlice";

const reportCards = [
  { id: "user-hours", title: "User-wise Hours", desc: "Total hours by user across date range", icon: Users, color: "gradient-primary" },
  { id: "project-effort", title: "Project-wise Effort", desc: "Hours, trend and user contribution by project", icon: FolderKanban, color: "gradient-info" },
  { id: "category-effort", title: "Category-wise Report", desc: "Meeting, vacation, training visibility", icon: Clock, color: "gradient-warning" },
  { id: "missing-submissions", title: "Missing Submissions", desc: "Users who didn't submit by deadline", icon: AlertTriangle, color: "gradient-destructive" },
];
const periods: ReportPeriod[] = ["daily", "weekly", "monthly"];
const formats: ReportFormat[] = ["csv", "xlsx", "pdf"];

type UserHoursRow = {
  user: string;
  total_hours: number;
};

const Reports = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.users);
  const { projects } = useAppSelector((state) => state.projects);
  
  const [reportType, setReportType] = useState<string>("user-hours");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/${reportType}?start_date=${startDate}&end_date=${endDate}`;
      if (reportType === "missing-submissions") {
        url = `/reports/missing-submissions?target_date=${endDate}`;
      }
      
      const { data } = await api.get<any[]>(url);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({
        title: "Failed to load report",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchProjects());
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const maxVal = useMemo(() => {
    if (reportType === "user-hours") return Math.max(...rows.map((r) => r.total_hours), 1);
    if (reportType === "project-effort") return Math.max(...rows.map((r) => r.total_hours), 1);
    return 100;
  }, [rows, reportType]);

  const handleDownload = async (period: ReportPeriod, format: ReportFormat) => {
    try {
      await downloadReport(period, format, startDate, endDate);
      toast({ title: `${period} ${format.toUpperCase()} downloaded` });
    } catch (e: any) {
      toast({
        title: "Export failed",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Reports</h1>
          <p className="page-subheader mt-1">Generate and export system-wide reports</p>
        </div>
        <span className="text-xs text-muted-foreground">Daily / Weekly / Monthly in CSV, Excel, PDF</span>
      </div>

      {/* Filters */}
      <Card className="section-card card-hover">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-3">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px] rounded-xl h-10" />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px] rounded-xl h-10" />
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[150px] rounded-xl h-10"><SelectValue placeholder="User" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[150px] rounded-xl h-10"><SelectValue placeholder="Project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="rounded-xl gradient-primary text-primary-foreground shadow" onClick={loadReport}>Generate Report</Button>
          </div>
        </CardContent>
      </Card>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((r) => (
          <Card 
            key={r.id} 
            className={`section-card cursor-pointer card-hover group transition-all ${reportType === r.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setReportType(r.id)}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${r.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <r.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export matrix */}
      <Card className="section-card card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Download Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {periods.map((p) => (
            <div key={p} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-2">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold capitalize">{p}</span>
              </div>
              <div className="flex gap-2">
                {formats.map((f) => (
                  <Button key={f} size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => handleDownload(p, f)}>
                    {f.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="section-card card-hover overflow-hidden">
        <CardHeader className="pb-3"><CardTitle className="text-base font-bold">Results Preview</CardTitle></CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground mb-3">Loading report…</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-2.5 text-left rounded-l-lg">
                    {reportType === "project-effort" ? "Project" : reportType === "category-effort" ? "Category" : "User"}
                  </th>
                  <th className="px-4 py-2.5 text-left">Metric</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                  <th className="px-4 py-2.5 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.length === 0 ? (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No data found for this period</td></tr>
                ) : (
                  rows.map((d, i) => {
                    const name = d.user || d.project || d.category || d.full_name;
                    const value = d.total_hours !== undefined ? `${d.total_hours}h` : (d.employee_code || "—");
                    const util = d.total_hours !== undefined ? Math.round((d.total_hours / maxVal) * 100) : 0;
                    
                    return (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary text-[9px] font-bold text-primary-foreground">
                              {name?.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                            <span className="font-semibold">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {reportType === "missing-submissions" ? "Missing Submission" : "Aggregated Effort"}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{value}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {d.total_hours !== undefined && (
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full bg-primary`} style={{ width: `${util}%` }} />
                              </div>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><FileText className="h-3.5 w-3.5"/></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;


