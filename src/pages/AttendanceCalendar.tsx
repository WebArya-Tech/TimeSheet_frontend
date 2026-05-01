import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import {
  ChevronLeft, ChevronRight, Calendar, Clock, MapPin, CheckCircle2, XCircle, Coffee, Palmtree, AlertTriangle,
} from "lucide-react";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchHolidays } from "@/lib/features/leaves/leaveSlice";

type DayStatus = "present" | "absent" | "leave" | "holiday" | "half-day" | "weekend" | "wfh" | "late" | null;

interface DayData {
  date: number;
  status: DayStatus;
  checkIn?: string;
  checkOut?: string;
  hours?: number;
  note?: string;
}

interface TodayAttendance {
  date: string;
  status: DayStatus | string;
  check_in?: string | null;
  check_out?: string | null;
  hours?: number | null;
  note?: string | null;
}

interface WeeklySummary {
  week_start: string;
  week_end: string;
  total_hours: number;
  days_present: number;
  days_absent: number;
  days_leave: number;
  days_late: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  present: { label: "Present", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
  absent: { label: "Absent", color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800", icon: XCircle },
  leave: { label: "Leave", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800", icon: Palmtree },
  holiday: { label: "Holiday", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800", icon: Coffee },
  "half-day": { label: "Half Day", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800", icon: Clock },
  weekend: { label: "Weekend", color: "text-muted-foreground", bg: "bg-muted/40 border-muted", icon: Coffee },
  wfh: { label: "WFH", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800", icon: MapPin },
  late: { label: "Late", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800", icon: AlertTriangle },
};

// Removed hardcoded holidays2026

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const generateMonthSkeleton = (year: number, month: number, holidays: any[]): DayData[] => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const data: DayData[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    const isPast = date <= today;

    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const holiday = holidays.find(h => h.holiday_date === formattedDate);

    let status: DayStatus = null;
    let checkIn, checkOut;
    let hours = 0;
    let note = "";

    if (holiday) {
      status = "holiday";
      note = holiday.holiday_name;
    } else if (dow === 0 || dow === 6) {
      status = "weekend";
    }

    data.push({ date: d, status, checkIn, checkOut, hours, note });
  }
  return data;
};

const AttendanceCalendar = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { holidays } = useAppSelector((state) => state.leaves);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  if (user?.role?.toLowerCase() === "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Monitoring Mode</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          As a Super Admin, your account is in monitoring mode. You do not need to fill personal attendance. 
          Please use the <strong>Global Activity</strong> or <strong>Org Structure</strong> pages to view attendance for all users.
        </p>
      </div>
    );
  }

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [records, setRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyActionLoading, setDailyActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<TodayAttendance | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);

  const fetchTodayAndWeekly = async () => {
    try {
      const [todayRes, weeklyRes] = await Promise.all([
        api.get<TodayAttendance>("/attendances/today"),
        api.get<WeeklySummary>("/attendances/weekly-summary"),
      ]);
      setTodayRecord(todayRes.data);
      setWeeklySummary(weeklyRes.data);
    } catch (e: any) {
      console.error("Failed to refresh attendance", e);
    }
  };

  const fetchMonthRecords = async () => {
    const { data } = await api.get<any[]>(`/attendances/my?year=${currentYear}&month=${currentMonth}`);
    setRecords(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [monthRes, todayRes, weeklyRes, leaveRes] = await Promise.all([
          api.get<any[]>(`/attendances/my?year=${currentYear}&month=${currentMonth}`),
          api.get<TodayAttendance>("/attendances/today"),
          api.get<WeeklySummary>("/attendances/weekly-summary"),
          api.get<any[]>("/leaves/my"),
        ]);
        if (mounted) {
          setRecords(Array.isArray(monthRes.data) ? monthRes.data : []);
          setTodayRecord(todayRes.data);
          setWeeklySummary(weeklyRes.data);
          setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : []);
        }
      } catch (e: any) {
        toast({
          title: "Failed to load attendance",
          description: e?.response?.data?.detail || "Network error",
          variant: "destructive",
        });
        if (mounted) {
          setRecords([]);
          setTodayRecord(null);
          setWeeklySummary(null);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentYear, currentMonth, toast]);

  const recordByDay = useMemo(() => {
    const map = new Map<number, any>();
    for (const r of records) {
      const day = Number(r?.dateNum ?? (typeof r?.date === "string" ? r.date.split("-")[2] : NaN));
      if (!Number.isNaN(day)) map.set(day, r);
    }
    return map;
  }, [records]);

  const monthData = useMemo(() => {
    const skeleton = generateMonthSkeleton(currentYear, currentMonth, holidays);
    return skeleton.map((d) => {
      const rec = recordByDay.get(d.date);
      
      // Check for approved leave
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d.date).padStart(2, "0")}`;
      const leave = leaves.find(l => 
        l.status === "approved" && dateStr >= l.from_date && dateStr <= l.to_date
      );

      if (leave) {
        return {
          ...d,
          status: "leave",
          note: leave.leave_type + ": " + leave.reason,
        } satisfies DayData;
      }

      if (!rec) return d;
      return {
        date: d.date,
        status: (rec.status as DayStatus) ?? d.status,
        checkIn: rec.checkIn ?? rec.check_in ?? d.checkIn,
        checkOut: rec.checkOut ?? rec.check_out ?? d.checkOut,
        hours: rec.hours ?? d.hours,
        note: rec.note ?? d.note,
      } satisfies DayData;
    });
  }, [currentYear, currentMonth, recordByDay, holidays, leaves]);
  const firstDow = new Date(currentYear, currentMonth, 1).getDay();

  const goMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDay(null);
  };

  // Summary stats
  const summary = {
    present: monthData.filter((d) => d.status === "present" || d.status === "wfh").length,
    absent: monthData.filter((d) => d.status === "absent").length,
    leave: monthData.filter((d) => d.status === "leave").length,
    holiday: monthData.filter((d) => d.status === "holiday").length,
    halfDay: monthData.filter((d) => d.status === "half-day").length,
    late: monthData.filter((d) => d.status === "late").length,
    totalHours: Math.round(monthData.reduce((s, d) => s + (d.hours || 0), 0)),
    workingDays: monthData.filter((d) => d.status !== "weekend" && d.status !== "holiday" && d.status !== null).length,
  };

  const renderMiniMonth = (month: number) => {
    const data = generateMonthSkeleton(currentYear, month, holidays);
    const firstD = new Date(currentYear, month, 1).getDay();
    return (
      <Card
        key={month}
        className={`cursor-pointer card-hover transition-all ${month === currentMonth && viewMode === "month" ? "ring-2 ring-primary" : ""}`}
        onClick={() => { setCurrentMonth(month); setViewMode("month"); }}
      >
        <CardContent className="p-3">
          <p className="text-xs font-bold mb-2 text-center">{monthNames[month]}</p>
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstD }).map((_, i) => <div key={`e${i}`} />)}
            {data.map((d) => {
              const cfg = d.status ? statusConfig[d.status] : null;
              return (
                <div
                  key={d.date}
                  className={`h-3 w-3 rounded-sm mx-auto ${cfg ? cfg.bg.split(" ")[0] : "bg-transparent"}`}
                  title={`${d.date} ${monthNames[month]} - ${cfg?.label || "Future"}`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Attendance Calendar 📅</h1>
          <p className="page-subheader mt-1">{user?.name} · {user?.employeeCode} · {user?.department}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setViewMode("month")}>
            <Calendar className="h-4 w-4 mr-1" /> Month
          </Button>
          <Button variant={viewMode === "year" ? "default" : "outline"} size="sm" className="rounded-xl" onClick={() => setViewMode("year")}>
            <Calendar className="h-4 w-4 mr-1" /> Year
          </Button>
          <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(Number(v))}>
            <SelectTrigger className="w-[100px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Present", value: summary.present, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Absent", value: summary.absent, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
          { label: "Leave", value: summary.leave, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Holiday", value: summary.holiday, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Half Day", value: summary.halfDay, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Late", value: summary.late, color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
          { label: "Total Hours", value: summary.totalHours, color: "text-foreground", bg: "bg-muted/50" },
          { label: "Work Days", value: summary.workingDays, color: "text-foreground", bg: "bg-muted/50" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border`}>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily + Weekly attendance actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Daily Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Date</p>
                <p className="text-sm font-bold">{todayRecord?.date ?? "—"}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Status</p>
                <p className="text-sm font-bold capitalize">{String(todayRecord?.status ?? "absent").replace("-", " ")}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Check In</p>
                <p className="text-sm font-bold">{todayRecord?.check_in || "—"}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase">Check Out</p>
                <p className="text-sm font-bold">{todayRecord?.check_out || "—"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={dailyActionLoading || Boolean(todayRecord?.check_in)}
                onClick={async () => {
                  setDailyActionLoading(true);
                  try {
                    await api.post("/attendances/today/check-in", { status: "present" });
                    await fetchTodayAndWeekly();
                    await fetchMonthRecords();
                    toast({ title: "Checked in successfully" });
                  } catch (e: any) {
                    console.error("Check-in error", e?.response?.data ?? e);
                    toast({
                      title: "Check-in failed",
                      description: e?.response?.data?.detail || "Network error",
                      variant: "destructive",
                    });
                  } finally {
                    setDailyActionLoading(false);
                  }
                }}
              >
                Mark Daily Check-In
              </Button>
              <Button
                variant="secondary"
                disabled={dailyActionLoading || !todayRecord?.check_in || Boolean(todayRecord?.check_out)}
                onClick={async () => {
                  setDailyActionLoading(true);
                  try {
                    await api.post("/attendances/today/check-out", { status: "present" });
                    await fetchTodayAndWeekly();
                    await fetchMonthRecords();
                    toast({ title: "Checked out successfully" });
                  } catch (e: any) {
                    toast({
                      title: "Check-out failed",
                      description: e?.response?.data?.detail || "Network error",
                      variant: "destructive",
                    });
                  } finally {
                    setDailyActionLoading(false);
                  }
                }}
              >
                Mark Daily Check-Out
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Week Range</p>
              <p className="text-sm font-bold">{weeklySummary ? `${weeklySummary.week_start} to ${weeklySummary.week_end}` : "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2">Present: <span className="font-bold">{weeklySummary?.days_present ?? 0}</span></div>
              <div className="rounded-lg border p-2">Absent: <span className="font-bold">{weeklySummary?.days_absent ?? 0}</span></div>
              <div className="rounded-lg border p-2">Leave: <span className="font-bold">{weeklySummary?.days_leave ?? 0}</span></div>
              <div className="rounded-lg border p-2">Late: <span className="font-bold">{weeklySummary?.days_late ?? 0}</span></div>
            </div>
            <div className="rounded-xl border bg-primary/5 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Total Weekly Hours</p>
              <p className="text-xl font-extrabold text-primary">{weeklySummary?.total_hours ?? 0}h</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {loading && viewMode === "month" && (
        <div className="text-sm text-muted-foreground">Loading attendance…</div>
      )}

      {viewMode === "year" ? (
        /* Year View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => renderMiniMonth(i))}
        </div>
      ) : (
        /* Month View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => goMonth(-1)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg font-bold">{monthNames[currentMonth]} {currentYear}</CardTitle>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => goMonth(1)}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((dn) => (
                  <div key={dn} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">
                    {dn}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for first day offset */}
                {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                {/* Day cells */}
                {monthData.map((d) => {
                  const cfg = d.status ? statusConfig[d.status] : null;
                  const isToday = d.date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const isSelected = selectedDay?.date === d.date;
                  const Icon = cfg?.icon;
                  return (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDay(d)}
                      className={`aspect-square rounded-xl border p-1 flex flex-col items-center justify-center gap-0.5 transition-all text-xs
                        ${cfg ? cfg.bg : "border-transparent hover:border-border"}
                        ${isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                        ${isSelected ? "ring-2 ring-foreground/50 scale-105 shadow-md" : "hover:scale-[1.02]"}
                      `}
                    >
                      <span className={`font-bold leading-none ${isToday ? "text-primary" : cfg ? cfg.color : "text-muted-foreground/50"}`}>
                        {d.date}
                      </span>
                      {Icon && <Icon className={`h-3 w-3 ${cfg?.color}`} />}
                      {d.hours ? (
                        <span className="text-[9px] font-semibold text-muted-foreground">{d.hours}h</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`h-3 w-3 rounded-sm border ${cfg.bg}`} />
                    <span className="text-[10px] font-medium text-muted-foreground">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Day detail panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">
                  {selectedDay ? `${selectedDay.date} ${monthNames[currentMonth]} ${currentYear}` : "Select a day"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDay && selectedDay.status ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {(() => { const cfg = statusConfig[selectedDay.status!]; const I = cfg?.icon || CheckCircle2; return <I className={`h-5 w-5 ${cfg?.color || ""}`} />; })()}
                      <StatusBadge status={statusConfig[selectedDay.status!]?.label || selectedDay.status!} />
                    </div>
                    {selectedDay.note && (
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">{selectedDay.note}</p>
                    )}
                    {selectedDay.checkIn && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Check In</p>
                          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{selectedDay.checkIn}</p>
                        </div>
                        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-center">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Check Out</p>
                          <p className="text-lg font-extrabold text-red-500 dark:text-red-400">{selectedDay.checkOut || "—"}</p>
                        </div>
                      </div>
                    )}
                    {selectedDay.hours ? (
                      <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Hours</p>
                        <p className="text-2xl font-extrabold text-primary">{selectedDay.hours}h</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Click on a date to view attendance details</p>
                )}
              </CardContent>
            </Card>

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

            {/* Leave Balance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Leave Balance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: "Casual Leave", used: 3, total: 12 },
                  { type: "Sick Leave", used: 1, total: 6 },
                  { type: "Earned Leave", used: 0, total: 15 },
                  { type: "Comp Off", used: 0, total: 2 },
                ].map((l) => (
                  <div key={l.type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{l.type}</span>
                      <span className="text-muted-foreground">{l.used}/{l.total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(l.used / l.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;