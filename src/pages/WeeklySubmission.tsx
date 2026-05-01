import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import ProgressRing from "@/components/ProgressRing";
import { Send, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

type WeekEntry = {
  id: string;
  date: string;
  entry_type: string;
  project_id?: string | null;
  category_id?: string | null;
  project_name?: string | null;
  category_name?: string | null;
  project_or_activity?: string | null;
  task?: string | null;
  sub_task?: string | null;
  hours: number;
};
type WeekHeader = {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  total_hours: number;
  entries: WeekEntry[];
};

const WeeklySubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [week, setWeek] = useState<WeekHeader | null>(null);
  const [projectMap, setProjectMap] = useState<Record<string, string>>({});
  const [projectExpectedMap, setProjectExpectedMap] = useState<Record<string, string>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const targetHours = 40;
  const totalHours = week?.entries?.reduce((s, e) => s + e.hours, 0) || 0;
  const pct = Math.round((totalHours / targetHours) * 100);
  const submitted = week?.status === "Submitted" || week?.status === "Approved";

  const loadCurrentWeek = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<WeekHeader>("/timesheets/week-current");
      setWeek(data);
    } catch (e: any) {
      toast({ title: "Failed to load weekly timesheet", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [projRes, catRes, holidayRes, leaveRes] = await Promise.all([
        api.get("/projects"),
        api.get("/categories"),
        api.get("/holidays"),
        api.get("/leaves/my"),
      ]);
      const pMap: Record<string, string> = {};
      const pExp: Record<string, string> = {};
      const cMap: Record<string, string> = {};
      if (Array.isArray(projRes.data)) {
        projRes.data.forEach((p: any) => {
          pMap[p.id] = p.name;
          if (p.expected_completion_date) pExp[p.id] = p.expected_completion_date;
        });
      }
      if (Array.isArray(catRes.data)) {
        catRes.data.forEach((c: any) => { cMap[c.id] = c.category_name; });
      }
      setProjectMap(pMap);
      setProjectExpectedMap(pExp);
      setCategoryMap(cMap);
      setHolidays(Array.isArray(holidayRes.data) ? holidayRes.data : []);
      setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : []);
    } catch (err) {
      // non-fatal
    }
  };

  useEffect(() => {
    loadCurrentWeek();
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!week?.id) return;
    try {
      await api.post(`/timesheets/week/${week.id}/submit`);
      toast({ title: "Week submitted!", description: "Your weekly timesheet has been submitted for approval." });
      await loadCurrentWeek();
    } catch (e: any) {
      toast({ title: "Submit failed", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  const weekLabel = useMemo(() => {
    if (!week) return "Current Week";
    const s = new Date(week.week_start);
    const e = new Date(week.week_end);
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return `${fmt(s)} – ${fmt(e)}`;
  }, [week]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, WeekEntry[]> = {};
    
    // Initialize groups for all 7 days of the week
    if (week?.week_start) {
      const start = new Date(week.week_start);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];
        groups[dateKey] = [];
      }
    }

    week?.entries?.forEach(entry => {
      const dateKey = entry.date; 
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    return Object.entries(groups).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [week]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Weekly Submission</h1>
          <p className="page-subheader mt-1">Review and submit: {weekLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={week?.status || "Draft"} />
        </div>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Loading weekly data…</div>}

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-hover flex items-center">
          <CardContent className="flex items-center gap-4 p-5 w-full">
            <ProgressRing progress={pct} size={64} strokeWidth={5}>
              <span className="text-sm font-extrabold">{pct}%</span>
            </ProgressRing>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{totalHours}h</p>
              <p className="text-xs text-muted-foreground">of {targetHours}h target</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-extrabold">{week?.entries?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total entries</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-lg font-extrabold">{targetHours - totalHours > 0 ? targetHours - totalHours : 0}h</p>
              <p className="text-xs text-muted-foreground">Remaining hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries table */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Weekly Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-2.5 text-left rounded-l-lg">Date</th>
                  <th className="px-3 py-2.5 text-left">Type</th>
                  <th className="px-3 py-2.5 text-left">Project / Activity</th>
                  <th className="px-3 py-2.5 text-left hidden md:table-cell">Exp. Comp.</th>
                  <th className="px-3 py-2.5 text-left">Task</th>
                  <th className="px-3 py-2.5 text-left hidden sm:table-cell">Sub Task</th>
                  <th className="px-3 py-2.5 text-right rounded-r-lg">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {groupedEntries.map(([date, entriesForDay]) => {
                    const holiday = holidays.find(h => h.holiday_date === date);
                    const leave = leaves.find(l => l.status === "approved" && date >= l.from_date && date <= l.to_date);
                    
                    return (
                      <React.Fragment key={date}>
                        <tr className="bg-muted/20">
                          <td colSpan={7} className="px-3 py-2.5 font-bold text-foreground flex items-center gap-3">
                            {new Date(date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}
                            {holiday && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                                <AlertCircle className="h-3 w-3" /> Holiday: {holiday.holiday_name}
                              </span>
                            )}
                            {leave && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                <Clock className="h-3 w-3" /> On Leave: {leave.leave_type}
                              </span>
                            )}
                          </td>
                        </tr>
                        {entriesForDay.length === 0 && !holiday && !leave ? (
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground italic text-xs">No entries recorded for this day.</td>
                          </tr>
                        ) : (
                          entriesForDay.map((e) => (
                            <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-3 py-3 text-muted-foreground whitespace-nowrap text-xs"></td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${e.entry_type === "Project" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${e.entry_type === "Project" ? "bg-primary" : "bg-warning"}`} />
                                  {e.entry_type}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-semibold">{
                                e.project_or_activity || projectMap[e.project_id || ""] || categoryMap[e.category_id || ""] || e.project_name || e.category_name || "—"
                              }</td>
                              <td className="px-3 py-3 text-muted-foreground text-xs hidden md:table-cell">{e.project_id ? (projectExpectedMap[e.project_id] || '—') : (e.category_name || '—')}</td>
                              <td className="px-3 py-3 text-muted-foreground">{e.task || "—"}</td>
                              <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{e.sub_task || "—"}</td>
                              <td className="px-3 py-3 text-right font-bold">{e.hours}h</td>
                            </tr>
                          ))
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40 font-bold">
                  <td colSpan={6} className="px-3 py-3 text-right text-sm">Total</td>
                  <td className="px-3 py-3 text-right text-lg">{totalHours}h</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Submission */}
      <Card className="card-hover">
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Submission Note (optional)</label>
            <Textarea
              value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Add any notes for your admin..." rows={3}
              disabled={submitted} className="rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/daily-entry")} className="gap-1.5 rounded-xl">
              <ArrowLeft className="h-4 w-4" /> Back to Daily Entry
            </Button>
            <Button onClick={handleSubmit} disabled={submitted} className="gap-1.5 rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Send className="h-4 w-4" /> {submitted ? "Submitted ✓" : "Submit Week"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklySubmission;


