import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save, ArrowRight, ChevronLeft, ChevronRight, Copy, Clock, CalendarDays, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/StatusBadge";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";

// Match backend schema
interface TimeEntry {
  id?: string;
  timesheet_id?: string;
  project_id?: string;
  entry_type: "Project" | "Non-Project";
  date: string;
  task: string;
  sub_task: string;
  hours: number;
  expected_completion_date?: string;
  remarks: string;
  category_id?: string;
  project_name?: string;
  category_name?: string;
}

// Internal UI state
interface UIEntry {
  id: string;
  type: "project" | "non-project";
  projectOrActivity: string;
  expectedCompletion: string;
  task: string;
  subTask: string;
  hours: string;
  remarks: string;
  isBackendSaved?: boolean;
  project_id?: string;
  category_id?: string;
}

interface ProjectOption {
  id: string;
  name: string;
  expected_completion_date?: string;
}
interface CategoryOption {
  id: string;
  category_name: string;
}

const DailyTimesheet = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<UIEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  const loadMeta = async () => {
    try {
      const [projectRes, categoryRes, holidayRes, leaveRes] = await Promise.all([
        api.get<ProjectOption[]>("/projects"),
        api.get<CategoryOption[]>("/categories"),
        api.get<any[]>("/holidays"),
        api.get<any[]>("/leaves/my"),
      ]);
      setProjects(Array.isArray(projectRes.data) ? projectRes.data : []);
      setCategories(Array.isArray(categoryRes.data) ? categoryRes.data : []);
      setHolidays(Array.isArray(holidayRes.data) ? holidayRes.data : []);
      setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : []);
    } catch (e) {
      toast({ title: "Failed to load metadata", variant: "destructive" });
    }
  };

  const fetchEntries = async (date: Date) => {
    setIsLoading(true);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const { data } = await api.get(`/timesheets/daily?target_date=${formattedDate}`);

      const loadedEntries: UIEntry[] = data.map((e: TimeEntry) => {
        let typeVal: "project" | "non-project" = e.entry_type === "Project" ? "project" : "non-project";
        const optionId = typeVal === "project" ? (e.project_id || "") : (e.category_id || "");
        const fallbackLabel = e.project_name || e.category_name || e.task || "";

        return {
          id: e.id || String(Math.random()),
          type: typeVal,
          projectOrActivity: optionId || fallbackLabel,
          expectedCompletion: e.expected_completion_date || (typeVal === "non-project" ? "N/A" : ""),
          task: e.task,
          subTask: e.sub_task,
          hours: String(e.hours),
          remarks: e.remarks || "",
          isBackendSaved: true,
          project_id: e.project_id,
          category_id: e.category_id,
        };
      });

      setEntries(loadedEntries);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load timesheet", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchEntries(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const totalHours = entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
  const maxHours = 24;
  const expectedHours = 8;

  const addRow = () => {
    // prevent adding rows for future dates
    const today = new Date();
    const current = new Date(currentDate);
    if (current > today) {
      toast({ title: "Cannot add entries for future dates", variant: "destructive" });
      return;
    }

    setEntries([...entries, {
      id: "local_" + Date.now().toString(), type: "project", projectOrActivity: "",
      expectedCompletion: "", task: "", subTask: "", hours: "", remarks: "",
      isBackendSaved: false,
      project_id: undefined,
      category_id: undefined,
    }]);
  };

  const duplicateRow = (entry: UIEntry) => {
    setEntries([...entries, { ...entry, id: "local_" + Date.now().toString(), hours: "", isBackendSaved: false }]);
  };

  const deleteRow = async (id: string) => {
    const row = entries.find((e) => e.id === id);
    if (!row) return;
    if (!String(id).startsWith("local_") && row.isBackendSaved) {
      try {
        await api.delete(`/timesheets/entry/${id}`);
      } catch (e: any) {
        toast({ title: "Delete failed", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
        return;
      }
    }
    setEntries(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof UIEntry, value: string) => {
    setEntries(entries.map((e) => {
      if (e.id !== id) return e;
      const updated: UIEntry = { ...e, [field]: value, isBackendSaved: false }; // mark dirty
      if (field === "type") {
        updated.projectOrActivity = "";
        updated.expectedCompletion = value === "non-project" ? "N/A" : "";
        updated.project_id = undefined;
        updated.category_id = undefined;
      }
      if (field === "projectOrActivity" && e.type === "project") {
        const p = projects.find((p) => p.id === value);
        updated.expectedCompletion = p?.expected_completion_date || "";
        updated.project_id = value;
        updated.category_id = undefined;
      }
      if (field === "projectOrActivity" && e.type === "non-project") {
        updated.category_id = value;
        updated.project_id = undefined;
      }
      return updated;
    }));
  };

  const saveEntries = async () => {
    if (totalHours > maxHours) {
      toast({ title: "Total hours cannot exceed 24", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const formattedDate = currentDate.toISOString().split('T')[0];

    try {
      const unSaved = entries.filter(e => String(e.id).startsWith("local_") || !e.isBackendSaved);

      for (const e of unSaved) {
        const projectId = e.type === "project" ? (e.project_id || e.projectOrActivity || null) : null;
        const categoryId = e.type === "non-project" ? (e.category_id || e.projectOrActivity || null) : null;

        const payload: TimeEntry = {
          entry_type: e.type === "project" ? "Project" : "Non-Project",
          date: formattedDate,
          task: e.task || (
            e.type === "non-project"
              ? (categories.find((c) => c.id === (categoryId || ""))?.category_name || "Non-project work")
              : "Project task"
          ),
          sub_task: e.subTask || "N/A",
          hours: parseFloat(e.hours) || 0,
          remarks: e.remarks || ""
        };

        if (projectId) payload.project_id = projectId;
        if (categoryId) payload.category_id = categoryId;

        if (String(e.id).startsWith("local_")) {
          await api.post('/timesheets/entry', payload);
        } else {
          await api.put(`/timesheets/entry/${e.id}`, payload);
        }
      }

      toast({ title: "Draft saved successfully" });
      await fetchEntries(currentDate); // Reload
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.response?.data?.detail || "Network Error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAndContinue = async () => {
    await saveEntries();
    changeDate(1);
  };

  const formatDate = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const dateStr = currentDate.toISOString().split('T')[0];
  const holiday = holidays.find(h => h.holiday_date === dateStr);
  const leave = leaves.find(l => l.status === "approved" && dateStr >= l.from_date && dateStr <= l.to_date);

  const changeDate = (delta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    const today = new Date();
    // prevent navigating to future days beyond today
    if (d > today) {
      d.setTime(today.getTime());
    }
    setCurrentDate(d);
  };

  const getWeekRange = () => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - ((day + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (dt: Date) => dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
  };

  const hoursColor = totalHours > maxHours ? "text-destructive" : totalHours >= expectedHours ? "text-success" : "text-foreground";
  const getOptionLabel = (entry: UIEntry) => {
    if (entry.type === "project") {
      const p = projects.find((x) => x.id === entry.projectOrActivity || x.id === entry.project_id);
      return p?.name || entry.projectOrActivity || "—";
    }
    const c = categories.find((x) => x.id === entry.projectOrActivity || x.id === entry.category_id);
    return c?.category_name || entry.projectOrActivity || "—";
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Daily Timesheet</h1>
          <p className="page-subheader mt-1">Log your work for each day</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/weekly-submission")} className="gap-2 rounded-xl">
          <CalendarDays className="h-4 w-4" /> Week View
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="rounded-xl h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[180px]">
                <p className="text-sm font-bold text-foreground flex items-center justify-center gap-2">
                  {formatDate(currentDate)}
                  {holiday && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold" title={holiday.holiday_name}>
                      <CalendarDays className="h-3 w-3" /> H
                    </span>
                  )}
                  {leave && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold" title={leave.leave_type}>
                      <Clock className="h-3 w-3" /> L
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">Week: {getWeekRange()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="rounded-xl h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Today:</span>
                <span className={`text-lg font-extrabold ${hoursColor}`}>{totalHours}h</span>
                <span className="text-sm text-muted-foreground">/ {expectedHours}h</span>
              </div>
              <StatusBadge status="Draft" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 p-4 bg-muted/20">
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Add Entry
            </Button>
            <Button variant="outline" size="sm" onClick={saveEntries} disabled={isSaving} className="gap-1.5 rounded-xl">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save Draft
            </Button>
            <Button size="sm" disabled={isSaving} className="gap-1.5 rounded-xl gradient-primary text-primary-foreground shadow-sm" onClick={saveAndContinue}>
              Save & Continue <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8 mt-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Card key={entry.id} className="card-hover overflow-hidden animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <div className={`h-1 ${entry.type === "project" ? "gradient-primary" : "gradient-warning"}`} />
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${entry.type === "project" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                      {entry.type === "project" ? "Project" : "Non-Project"}
                    </span>
                    {entry.projectOrActivity && <span className="text-sm font-semibold text-foreground hidden sm:inline">{getOptionLabel(entry)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => duplicateRow(entry)} title="Duplicate">
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive" onClick={() => deleteRow(entry.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
                    <Select value={entry.type} onValueChange={(v) => updateEntry(entry.id, "type", v)}>
                      <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="non-project">Non-Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {entry.type === "project" ? "Project" : "Activity"}
                    </label>
                    <Select value={entry.projectOrActivity} onValueChange={(v) => updateEntry(entry.id, "projectOrActivity", v)}>
                      <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {entry.type === "project"
                          ? projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                          : categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Exp. Completion</label>
                    <Input value={entry.expectedCompletion} readOnly className="bg-muted/50 rounded-xl h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hours</label>
                    <Input
                      type="number" min="0" max="24" step="0.25"
                      value={entry.hours} onChange={(e) => updateEntry(entry.id, "hours", e.target.value)}
                      placeholder="0.0" className="rounded-xl h-10 font-bold text-center"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Task</label>
                    <Input value={entry.task} onChange={(e) => updateEntry(entry.id, "task", e.target.value)} placeholder="Main work item" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sub Task</label>
                    <Input value={entry.subTask} onChange={(e) => updateEntry(entry.id, "subTask", e.target.value)} placeholder="Micro-level detail" className="rounded-xl h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Remarks</label>
                    <Input value={entry.remarks} onChange={(e) => updateEntry(entry.id, "remarks", e.target.value)} placeholder="Optional notes" className="rounded-xl h-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && entries.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-16">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-muted mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No entries yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start logging your time by adding an entry</p>
            <Button onClick={addRow} className="gap-2 rounded-xl gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4" /> Add First Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-card border p-4">
          <span className="text-sm font-semibold text-muted-foreground">Daily Total</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-extrabold ${hoursColor}`}>{totalHours}h</span>
            <span className="text-sm text-muted-foreground">/ {expectedHours}h expected</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTimesheet;
