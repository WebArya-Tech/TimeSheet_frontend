import StatusBadge from "@/components/StatusBadge";
import ProgressRing from "@/components/ProgressRing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

type TeamItem = {
  id: string;
  employee_code: string;
  full_name: string;
  department: string;
  status: string;
  total_hours: number;
  week_start: string;
  week_end: string;
};

const TeamTimesheets = () => {
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<TeamItem[]>("/timesheets/team/week");
        setTeamData(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submitted = useMemo(() => teamData.filter((t) => t.status === "Submitted" || t.status === "Approved").length, [teamData]);
  const total = teamData.length || 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-header">Team Timesheets</h1>
        <p className="page-subheader mt-1">Overview of your team's weekly submissions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-hover flex items-center">
          <CardContent className="flex items-center gap-4 p-5 w-full">
            <ProgressRing progress={(submitted / total) * 100} size={56} strokeWidth={5}>
              <span className="text-xs font-extrabold">{submitted}/{total}</span>
            </ProgressRing>
            <div>
              <p className="text-sm font-bold">Submission Rate</p>
              <p className="text-xs text-muted-foreground">{Math.round((submitted / total) * 100)}% submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-lg font-extrabold">{teamData.filter((t) => t.status === "Draft").length}</p>
              <p className="text-xs text-muted-foreground">Not submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-lg font-extrabold">{teamData.filter((t) => t.status === "Approved").length}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Select defaultValue="current"><SelectTrigger className="w-[220px] rounded-xl h-10"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="current">Current week</SelectItem></SelectContent>
        </Select>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Loading team timesheets…</div>}

      <Card className="section-card overflow-hidden border-none shadow-xl shadow-primary/5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50">
                  <th className="px-6 py-4 text-left font-bold text-foreground/70 uppercase tracking-wider text-[10px]">Employee</th>
                  <th className="px-6 py-4 text-left font-bold text-foreground/70 uppercase tracking-wider text-[10px] hidden sm:table-cell">Department</th>
                  <th className="px-6 py-4 text-center font-bold text-foreground/70 uppercase tracking-wider text-[10px]">Work Hours</th>
                  <th className="px-6 py-4 text-left font-bold text-foreground/70 uppercase tracking-wider text-[10px] hidden md:table-cell">Utilization</th>
                  <th className="px-6 py-4 text-left font-bold text-foreground/70 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-4 text-right font-bold text-foreground/70 uppercase tracking-wider text-[10px]">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {teamData.length === 0 ? (
                  <tr><td colSpan={6} className="py-20 text-center text-muted-foreground font-medium">No team records found for this period.</td></tr>
                ) : (
                  teamData.map((t) => (
                    <tr key={t.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary text-[11px] font-black text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
                            {(t.full_name || "U").split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">{t.full_name || "Unknown User"}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{t.employee_code || "No Code"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border border-border/50">
                          {t.department || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-black text-sm">{t.total_hours}h</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${t.total_hours >= 40 ? "gradient-success" : t.total_hours > 0 ? "gradient-primary" : "bg-muted"}`} 
                              style={{ width: `${Math.min((t.total_hours / 40) * 100, 100)}%` }} 
                            />
                          </div>
                          <span className="text-[11px] font-bold text-muted-foreground">{Math.round((t.total_hours / 40) * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5 rounded-lg border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all font-bold text-[11px]" 
                          onClick={() => navigate("/approvals")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">View Details</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamTimesheets;


