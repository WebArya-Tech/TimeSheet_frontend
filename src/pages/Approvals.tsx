import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle2, RotateCcw, XCircle, ArrowRight, Clock, CalendarDays, FolderKanban, AlertCircle, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";

type ApprovalEntry = {
  date: string;
  task?: string | null;
  sub_task?: string | null;
  hours: number;
  entry_type?: string;
  project_name?: string | null;
  category_name?: string | null;
  project_or_activity?: string | null;
};
type ApprovalItem = {
  id: string;
  employee_code: string;
  full_name: string;
  user_role?: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  status: string;
  entries: ApprovalEntry[];
};

const Approvals = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [counts, setCounts] = useState({ timesheets: 0, attendance: 0, leaves: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const loadPending = async () => {
    setLoading(true);
    try {
      const [{ data: timesheets }, { data: attendance }, { data: leaves }] = await Promise.all([
        api.get<ApprovalItem[]>("/approvals/pending"),
        api.get<any[]>("/attendances/pending"),
        api.get<any[]>("/leaves/pending")
      ]);
      
      const tList = Array.isArray(timesheets) ? timesheets : [];
      const aList = Array.isArray(attendance) ? attendance : [];
      const lList = Array.isArray(leaves) ? leaves : [];

      setPendingApprovals(tList);
      setPendingAttendance(aList);
      setPendingLeaves(lList);
      
      setCounts({
        timesheets: tList.length,
        attendance: aList.length,
        leaves: lList.length
      });
      
      if (tList.length > 0 && !expandedId) setExpandedId(tList[0].id);
    } catch (e: any) {
      toast({
        title: "Failed to load approvals",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (action: "approve" | "return" | "reject", item: ApprovalItem) => {
    try {
      if (action === "approve") {
        await api.post(`/approvals/${item.id}/approve`);
      } else if (action === "return") {
        await api.post(`/approvals/${item.id}/return`, { status: "Returned", admin_comment: comments[item.id] || "Returned for correction" });
      } else {
        await api.post(`/approvals/${item.id}/reject`, { status: "Rejected", admin_comment: comments[item.id] || "Rejected by admin" });
      }
      toast({ title: `Week ${action}d`, description: `${item.full_name}'s timesheet updated.` });
      await loadPending();
    } catch (e: any) {
      toast({
        title: "Action failed",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    }
  };

  const formatRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return `${fmt(s)} – ${fmt(e)}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-header">Pending Approvals</h1>
        <p className="page-subheader mt-1">Review items awaiting your action</p>
        
        <div className="flex flex-wrap gap-3 mt-4">
          <Button 
            variant={counts.timesheets > 0 ? "default" : "outline"} size="sm" 
            className={`rounded-xl gap-2 ${counts.timesheets > 0 ? "gradient-primary border-none shadow-md shadow-primary/20" : ""}`}
            onClick={() => navigate("/approvals")}
          >
            <FolderKanban className="h-4 w-4" /> {counts.timesheets} Timesheets
          </Button>
          <Button 
            variant={counts.attendance > 0 ? "default" : "outline"} size="sm" 
            className={`rounded-xl gap-2 ${counts.attendance > 0 ? "bg-warning text-warning-foreground border-none shadow-md shadow-warning/20" : ""}`}
            onClick={() => navigate("/attendance-approvals")}
          >
            <Clock className="h-4 w-4" /> {counts.attendance} Attendance
          </Button>
          <Button 
            variant={counts.leaves > 0 ? "default" : "outline"} size="sm" 
            className={`rounded-xl gap-2 ${counts.leaves > 0 ? "bg-info text-info-foreground border-none shadow-md shadow-info/20" : ""}`}
            onClick={() => navigate("/leave-approvals")}
          >
            <CalendarDays className="h-4 w-4" /> {counts.leaves} Leaves
          </Button>
        </div>

        {user?.role?.toLowerCase() === "admin" && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 mt-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-warning-foreground leading-relaxed">
              <p className="font-bold">Manager Mode</p>
              <p>You are reviewing requests for users under your supervision. Super-admins have read-only visibility across all departments.</p>
            </div>
          </div>
        )}
        {user?.role?.toLowerCase() === "super_admin" && (
          <div className="rounded-2xl border border-success/30 bg-success/10 p-3 mt-3 text-sm text-success-foreground">
            Super admins have full visibility across the organization but do not perform approvals.
          </div>
        )}
      </div>
      {loading && <div className="text-sm text-muted-foreground">Loading approvals…</div>}

      {pendingApprovals.length === 0 && !loading && (
        <Card className="section-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="font-medium">No weekly timesheets pending approval</p>
            {(counts.attendance > 0 || counts.leaves > 0) && (
              <p className="text-xs mt-2">Check Attendance or Leaves for other pending items.</p>
            )}
          </CardContent>
        </Card>
      )}

      {pendingApprovals.map((item) => (
        <Card key={item.id} className="card-hover overflow-hidden">
          <div className="h-1 gradient-info" />
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground shadow">
                  {(item.full_name || "U").split(" ").filter(Boolean).map((n) => n[0]).join("")}
                </div>
                <div>
                  <CardTitle className="text-base font-bold">{item.full_name || "Unknown User"} <span className="text-muted-foreground font-normal text-xs">({item.employee_code || "—"})</span></CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRange(item.week_start, item.week_end)} · {item.total_hours || 0} hours</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === item.id ? "rotate-90" : ""}`} />
              </div>
            </div>
          </CardHeader>

          {expandedId === item.id && (
            <CardContent className="space-y-4 animate-slide-up">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="table-header">
                    <th className="px-3 py-2.5 text-left rounded-l-lg">Day</th>
                    <th className="px-3 py-2.5 text-left">Type</th>
                    <th className="px-3 py-2.5 text-left">Project / Activity</th>
                    <th className="px-3 py-2.5 text-left">Task</th>
                    <th className="px-3 py-2.5 text-left hidden sm:table-cell">Sub Task</th>
                    <th className="px-3 py-2.5 text-right rounded-r-lg">Hours</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border/50">
                    {(item.entries || []).map((e, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 text-muted-foreground text-xs">{e.date ? new Date(e.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }) : "—"}</td>
                        <td className="px-3 py-2.5 font-semibold">{e.entry_type || "—"}</td>
                        <td className="px-3 py-2.5">{e.project_or_activity || e.project_name || e.category_name || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{e.task || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{e.sub_task || "—"}</td>
                        <td className="px-3 py-2.5 text-right font-bold">{e.hours || 0}h</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 font-bold">
                      <td colSpan={5} className="px-3 py-2.5 text-right">Total</td>
                      <td className="px-3 py-2.5 text-right">{item.total_hours}h</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Admin Comment</label>
                <Textarea
                  value={comments[item.id] || ""}
                  onChange={(e) => setComments({ ...comments, [item.id]: e.target.value })}
                  placeholder="Add comment for the user..." rows={2} className="rounded-xl"
                />
              </div>

              {((user?.role?.toLowerCase() === "admin" && item.user_role?.toLowerCase() === "user") || 
                (user?.role?.toLowerCase() === "super_admin" && item.user_role?.toLowerCase() === "admin")) && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="gap-1.5 rounded-xl gradient-success text-success-foreground shadow" onClick={() => handleAction("approve", item)}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => handleAction("return", item)}>
                    <RotateCcw className="h-4 w-4" /> Return for Correction
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => handleAction("reject", item)}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default Approvals;


