import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ChevronLeft, ChevronRight, Calendar, Palmtree, Coffee, HeartPulse, GraduationCap,
  Baby, Briefcase, CheckCircle2, XCircle, Clock, X, Send, Eye,
} from "lucide-react";
import api from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchHolidays } from "@/lib/features/leaves/leaveSlice";

type LeaveType = "casual" | "sick" | "earned" | "compoff" | "maternity" | "paternity" | "unpaid";
type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

interface LeaveRequest {
  id: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approvedBy?: string;
  comment?: string;
}

const leaveTypeConfig: Record<LeaveType, { label: string; icon: React.ElementType; color: string; bg: string; total: number; used: number }> = {
  casual: { label: "Casual Leave", icon: Palmtree, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", total: 12, used: 3 },
  sick: { label: "Sick Leave", icon: HeartPulse, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", total: 6, used: 1 },
  earned: { label: "Earned Leave", icon: Briefcase, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", total: 15, used: 2 },
  compoff: { label: "Comp Off", icon: Coffee, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", total: 4, used: 1 },
  maternity: { label: "Maternity", icon: Baby, color: "text-pink-500 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800", total: 180, used: 0 },
  paternity: { label: "Paternity", icon: Baby, color: "text-purple-500 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800", total: 15, used: 0 },
  unpaid: { label: "Unpaid Leave", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted/30 border-muted", total: 999, used: 0 },
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Removed hardcoded holidays2026

const statusBadgeMap: Record<LeaveStatus, string> = {
  pending: "Submitted", approved: "Approved", rejected: "Rejected", cancelled: "Draft",
};

const LeaveManagement = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { holidays } = useAppSelector((state) => state.leaves);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  if (user?.role === "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Palmtree className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Governance Mode</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Super Admin accounts are for governance and monitoring. Personal leave application is disabled. 
          Use the <strong>Global Activity</strong> monitor to view leave requests across the organization.
        </p>
      </div>
    );
  }

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const [newLeave, setNewLeave] = useState({
    type: "casual" as LeaveType,
    from: "",
    to: "",
    reason: "",
  });

  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<any[]>("/leaves/my");
        const mapped: LeaveRequest[] = (Array.isArray(data) ? data : []).map((l: any) => ({
          id: String(l.id),
          type: (l.type || l.leave_type || "casual") as LeaveType,
          from: String(l.from || l.from_date || ""),
          to: String(l.to || l.to_date || ""),
          days: Number(l.days || 0),
          reason: String(l.reason || ""),
          status: (l.status || "pending") as LeaveStatus,
          appliedOn: String(l.applied_on || l.appliedOn || ""),
          approvedBy: l?.approved_by?.full_name,
          comment: l?.approver_comment,
        }));
        if (mounted) setLeaves(mapped);
      } catch (e: any) {
        toast({
          title: "Failed to load leaves",
          description: e?.response?.data?.detail || "Network error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [toast]);

  const goMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDow = (y: number, m: number) => new Date(y, m, 1).getDay();

  const isHoliday = (y: number, m: number, d: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return holidays.find((h) => h.holiday_date === dateStr);
  };
  const isWeekend = (y: number, m: number, d: number) => { const dow = new Date(y, m, d).getDay(); return dow === 0 || dow === 6; };

  const getLeaveForDate = (y: number, m: number, d: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return leaves.find((l) => {
      return l.status !== "rejected" && l.status !== "cancelled" && dateStr >= l.from && dateStr <= l.to;
    });
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.from || !newLeave.to || !newLeave.reason) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    const fromDate = new Date(newLeave.from);
    const toDate = new Date(newLeave.to);
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    (async () => {
      try {
        const payload = {
          leave_type: newLeave.type,
          from_date: newLeave.from,
          to_date: newLeave.to,
          days,
          reason: newLeave.reason,
        };
        const { data } = await api.post<any>("/leaves", payload);
        const created: LeaveRequest = {
          id: String(data?.id ?? Date.now()),
          type: (data?.type || data?.leave_type || newLeave.type) as LeaveType,
          from: String(data?.from || data?.from_date || newLeave.from),
          to: String(data?.to || data?.to_date || newLeave.to),
          days: Number(data?.days ?? days),
          reason: String(data?.reason ?? newLeave.reason),
          status: (data?.status || "pending") as LeaveStatus,
          appliedOn: String(data?.applied_on || today.toISOString().split("T")[0]),
        };
        setLeaves((prev) => [created, ...prev]);
        setShowApplyForm(false);
        setNewLeave({ type: "casual", from: "", to: "", reason: "" });
        toast({ title: "Leave request submitted", description: `${leaveTypeConfig[newLeave.type].label} for ${days} day(s)` });
      } catch (err: any) {
        toast({
          title: "Failed to submit leave",
          description: err?.response?.data?.detail || "Network error",
          variant: "destructive",
        });
      }
    })();
  };

  const handleCancelLeave = (id: string) => {
    (async () => {
      try {
        await api.put(`/leaves/${id}/cancel`);
        setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: "cancelled" as LeaveStatus } : l)));
        toast({ title: "Leave request cancelled" });
      } catch (err: any) {
        toast({
          title: "Failed to cancel leave",
          description: err?.response?.data?.detail || "Network error",
          variant: "destructive",
        });
      }
    })();
  };

  const filteredLeaves = filterStatus === "all" ? leaves : leaves.filter((l) => l.status === filterStatus);

  const renderCalendar = (year: number, month: number, mini = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getFirstDow(year, month);

    return (
      <div>
        {!mini && (
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((dn) => (
              <div key={dn} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">{dn}</div>
            ))}
          </div>
        )}
        <div className={`grid grid-cols-7 ${mini ? "gap-px" : "gap-1"}`}>
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} className={mini ? "h-3" : "aspect-square"} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const hol = isHoliday(year, month, d);
            const wknd = isWeekend(year, month, d);
            const leave = getLeaveForDate(year, month, d);
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            if (mini) {
              let bg = "bg-transparent";
              if (hol) bg = "bg-purple-200 dark:bg-purple-800";
              else if (leave) bg = leave.status === "approved" ? "bg-emerald-200 dark:bg-emerald-800" : "bg-amber-200 dark:bg-amber-800";
              else if (wknd) bg = "bg-muted";
              return <div key={d} className={`h-3 w-3 rounded-sm mx-auto ${bg}`} />;
            }

            let cellBg = "border-transparent";
            let textColor = "text-foreground";
            if (hol) { cellBg = "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800"; textColor = "text-purple-600 dark:text-purple-400"; }
            else if (leave) {
              const cfg = leaveTypeConfig[leave.type];
              cellBg = cfg.bg;
              textColor = cfg.color;
            } else if (wknd) { cellBg = "bg-muted/40 border-muted"; textColor = "text-muted-foreground"; }

            return (
              <button
                key={d}
                onClick={() => leave && setSelectedLeave(leave)}
                className={`aspect-square rounded-xl border p-0.5 flex flex-col items-center justify-center gap-0 transition-all text-xs hover:scale-[1.03]
                  ${cellBg} ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                `}
              >
                <span className={`font-bold leading-none text-[11px] ${isToday ? "text-primary" : textColor}`}>{d}</span>
                {hol && <Coffee className={`h-2.5 w-2.5 mt-0.5 text-purple-500`} />}
                {leave && !hol && (() => { const I = leaveTypeConfig[leave.type].icon; return <I className={`h-2.5 w-2.5 mt-0.5 ${leaveTypeConfig[leave.type].color}`} />; })()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Leave Management 🌴</h1>
          <p className="page-subheader mt-1">{user?.name} · {user?.employeeCode} · Track and manage your leaves</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setViewMode("month")}>
            <Calendar className="h-4 w-4 mr-1" /> Month
          </Button>
          <Button variant={viewMode === "year" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setViewMode("year")}>
            <Calendar className="h-4 w-4 mr-1" /> Year
          </Button>
          <Button onClick={() => setShowApplyForm(true)} className="gap-2 rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" /> Apply Leave
          </Button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(["casual", "sick", "earned", "compoff", "maternity", "paternity"] as LeaveType[]).map((type) => {
          const cfg = leaveTypeConfig[type];
          const remaining = cfg.total - cfg.used;
          const pct = (cfg.used / cfg.total) * 100;
          return (
            <Card key={type} className={`${cfg.bg} border overflow-hidden`}>
              <CardContent className="p-3 text-center">
                <cfg.icon className={`h-5 w-5 mx-auto mb-1.5 ${cfg.color}`} />
                <p className={`text-lg font-extrabold ${cfg.color}`}>{remaining}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{cfg.label}</p>
                <div className="h-1.5 rounded-full bg-foreground/10 mt-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct > 75 ? "bg-destructive" : pct > 50 ? "bg-warning" : "bg-success"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">{cfg.used}/{cfg.total} used</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Apply Leave Modal */}
      {showApplyForm && (
        <Card className="border-2 border-primary/20 shadow-lg animate-scale-in">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Apply for Leave
            </CardTitle>
            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setShowApplyForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Leave Type</Label>
                  <Select value={newLeave.type} onValueChange={(v) => setNewLeave({ ...newLeave, type: v as LeaveType })}>
                    <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(leaveTypeConfig) as LeaveType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          <span className="flex items-center gap-2">
                            {leaveTypeConfig[t].label}
                            <span className="text-[10px] text-muted-foreground">({leaveTypeConfig[t].total - leaveTypeConfig[t].used} left)</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">From Date</Label>
                  <Input type="date" value={newLeave.from} onChange={(e) => setNewLeave({ ...newLeave, from: e.target.value })} className="rounded-xl h-11" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">To Date</Label>
                  <Input type="date" value={newLeave.to} onChange={(e) => setNewLeave({ ...newLeave, to: e.target.value })} className="rounded-xl h-11" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Days</Label>
                  <Input value={newLeave.from && newLeave.to ? Math.max(1, Math.ceil((new Date(newLeave.to).getTime() - new Date(newLeave.from).getTime()) / 86400000) + 1) : ""} readOnly className="rounded-xl h-11 bg-muted/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reason</Label>
                <Textarea value={newLeave.reason} onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })} placeholder="Explain the reason for leave..." rows={2} className="rounded-xl" required />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowApplyForm(false)}>Cancel</Button>
                <Button type="submit" className="gap-2 rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <Send className="h-4 w-4" /> Submit Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              {viewMode === "month" && (
                <>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => goMonth(-1)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">{monthNames[currentMonth]} {currentYear}</CardTitle>
                    <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(Number(v))}>
                      <SelectTrigger className="w-[80px] h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => goMonth(1)}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              {viewMode === "year" && (
                <div className="flex items-center gap-3 w-full justify-between">
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentYear(currentYear - 1)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <CardTitle className="text-lg font-bold">{currentYear} — Full Year View</CardTitle>
                  <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentYear(currentYear + 1)}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-sm text-muted-foreground mb-4">Loading leaves…</div>
            )}
            {viewMode === "month" ? (
              <>
                {renderCalendar(currentYear, currentMonth)}
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
                  {[
                    { label: "Holiday", bg: "bg-purple-200 dark:bg-purple-800" },
                    { label: "Approved Leave", bg: "bg-emerald-200 dark:bg-emerald-800" },
                    { label: "Pending Leave", bg: "bg-amber-200 dark:bg-amber-800" },
                    { label: "Weekend", bg: "bg-muted" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <div className={`h-3 w-3 rounded-sm ${l.bg}`} />
                      <span className="text-[10px] font-medium text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => (
                  <Card key={i} className={`cursor-pointer card-hover ${i === currentMonth ? "ring-2 ring-primary" : ""}`} onClick={() => { setCurrentMonth(i); setViewMode("month"); }}>
                    <CardContent className="p-3">
                      <p className="text-xs font-bold mb-2 text-center">{monthNames[i]}</p>
                      {renderCalendar(currentYear, i, true)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected leave detail */}
          {selectedLeave && (
            <Card className="animate-scale-in border-primary/20">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold">Leave Details</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setSelectedLeave(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {(() => { const cfg = leaveTypeConfig[selectedLeave.type]; const I = cfg.icon; return <I className={`h-5 w-5 ${cfg.color}`} />; })()}
                  <span className="text-sm font-semibold">{leaveTypeConfig[selectedLeave.type].label}</span>
                  <StatusBadge status={statusBadgeMap[selectedLeave.status]} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">From</p>
                    <p className="text-xs font-bold">{selectedLeave.from}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/50 p-2.5 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">To</p>
                    <p className="text-xs font-bold">{selectedLeave.to}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                  <p className="text-2xl font-extrabold text-primary">{selectedLeave.days}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Day(s)</p>
                </div>
                <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">{selectedLeave.reason}</p>
                {selectedLeave.comment && (
                  <p className="text-xs text-destructive bg-destructive/5 rounded-lg p-2.5 border border-destructive/10">
                    Admin: {selectedLeave.comment}
                  </p>
                )}
                {selectedLeave.status === "pending" && (
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-destructive hover:text-destructive" onClick={() => { handleCancelLeave(selectedLeave.id); setSelectedLeave(null); }}>
                    Cancel Request
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Holidays */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Upcoming Holidays</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {holidays
                .filter((h) => new Date(h.holiday_date) >= today)
                .slice(0, 5)
                .map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-2.5">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold">{h.holiday_name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(h.holiday_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Leave Summary ({currentYear})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["casual", "sick", "earned", "compoff"] as LeaveType[]).map((type) => {
                const cfg = leaveTypeConfig[type];
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      <span className="text-xs font-medium">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-bold">{cfg.used}/{cfg.total}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave History Table */}
      <Card className="card-hover">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Leave History</CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] rounded-xl h-9 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-2.5 text-left rounded-l-lg">Type</th>
                  <th className="px-3 py-2.5 text-left">From</th>
                  <th className="px-3 py-2.5 text-left">To</th>
                  <th className="px-3 py-2.5 text-center">Days</th>
                  <th className="px-3 py-2.5 text-left hidden sm:table-cell">Reason</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-center rounded-r-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLeaves.map((l) => {
                  const cfg = leaveTypeConfig[l.type];
                  return (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                          <span className="font-medium text-xs">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{l.from}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{l.to}</td>
                      <td className="px-3 py-3 text-center font-bold">{l.days}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">{l.reason}</td>
                      <td className="px-3 py-3 text-center"><StatusBadge status={statusBadgeMap[l.status]} /></td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg" onClick={() => setSelectedLeave(l)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {l.status === "pending" && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-destructive" onClick={() => handleCancelLeave(l.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredLeaves.length === 0 && (
            <div className="text-center py-8">
              <Palmtree className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No leave records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveManagement;


