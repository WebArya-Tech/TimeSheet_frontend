import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Clock, Lock, Server } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
type SettingsPayload = {
  expected_hours_per_day: number;
  max_daily_hours: number;
  weekly_submission_day: "friday" | "saturday" | "sunday";
  lock_week_after_approval: boolean;
};
type SystemInfo = {
  system_version: string;
  total_users: number;
  active_projects: number;
  categories: number;
  holidays: number;
  last_backup?: string | null;
};
type AuditItem = {
  id: string;
  time: string;
  user: string;
  module: string;
  action: string;
  detail: string;
};

const SettingsAudit = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsPayload>({
    expected_hours_per_day: 8,
    max_daily_hours: 24,
    weekly_submission_day: "friday",
    lock_week_after_approval: true,
  });
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("all");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, iRes, aRes] = await Promise.all([
        api.get<SettingsPayload>("/system/settings"),
        api.get<SystemInfo>("/system/info"),
        api.get<AuditItem[]>("/system/audit-logs?limit=100"),
      ]);
      setSettings({
        expected_hours_per_day: Number(sRes.data?.expected_hours_per_day ?? 8),
        max_daily_hours: Number(sRes.data?.max_daily_hours ?? 24),
        weekly_submission_day: (sRes.data?.weekly_submission_day ?? "friday") as "friday" | "saturday" | "sunday",
        lock_week_after_approval: Boolean(sRes.data?.lock_week_after_approval ?? true),
      });
      setInfo(iRes.data || null);
      setAudits(Array.isArray(aRes.data) ? aRes.data : []);
    } catch (e: any) {
      toast({
        title: "Failed to load settings/audit",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = async () => {
    try {
      await api.put("/system/settings", settings);
      toast({ title: "Settings saved successfully" });
      await loadAll();
    } catch (e: any) {
      toast({
        title: "Failed to save settings",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    }
  };

  const filteredAudits = useMemo(() => {
    if (moduleFilter === "all") return audits;
    return audits.filter((a) => a.module.toLowerCase() === moduleFilter.toLowerCase());
  }, [audits, moduleFilter]);

  const moduleOptions = useMemo(() => {
    const set = new Set(audits.map((a) => a.module));
    return Array.from(set);
  }, [audits]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-header">Settings & Audit</h1>
        <p className="page-subheader mt-1">System configuration and change history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow">
                <Settings className="h-4 w-4 text-primary-foreground" />
              </div>
              <CardTitle className="text-base font-bold">System Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Expected Hours/Day</Label>
                <Input type="number" value={settings.expected_hours_per_day} onChange={(e) => setSettings((s) => ({ ...s, expected_hours_per_day: Number(e.target.value || 0) }))} className="rounded-xl h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Max Daily Hours</Label>
                <Input type="number" value={settings.max_daily_hours} onChange={(e) => setSettings((s) => ({ ...s, max_daily_hours: Number(e.target.value || 0) }))} className="rounded-xl h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Weekly Submission Day</Label>
              <Select value={settings.weekly_submission_day} onValueChange={(v: "friday" | "saturday" | "sunday") => setSettings((s) => ({ ...s, weekly_submission_day: v }))}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/50 p-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Lock Week After Approval</Label>
              </div>
              <Switch checked={settings.lock_week_after_approval} onCheckedChange={(v) => setSettings((s) => ({ ...s, lock_week_after_approval: !!v }))} />
            </div>
            <Button onClick={saveSettings} className="w-full rounded-xl gradient-primary text-primary-foreground shadow">Save Settings</Button>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-info shadow">
                <Server className="h-4 w-4 text-primary-foreground" />
              </div>
              <CardTitle className="text-base font-bold">System Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "System Version", value: info?.system_version || "v1.0", icon: "🏷️" },
              { label: "Total Users", value: String(info?.total_users ?? 0), icon: "👥" },
              { label: "Active Projects", value: String(info?.active_projects ?? 0), icon: "📁" },
              { label: "Categories", value: String(info?.categories ?? 0), icon: "🏷️" },
              { label: "Holidays", value: String(info?.holidays ?? 0), icon: "📅" },
              { label: "Last Backup", value: info?.last_backup ? new Date(info.last_backup).toLocaleString("en-GB") : "N/A", icon: "💾" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-muted/30 border border-border/50 p-3">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </span>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-warning shadow">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <CardTitle className="text-base font-bold">Audit Logs</CardTitle>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Input type="date" className="w-[150px] rounded-xl h-9 text-xs" />
              <Select value={moduleFilter} onValueChange={setModuleFilter}><SelectTrigger className="w-[160px] rounded-xl h-9 text-xs"><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {moduleOptions.map((m) => (
                    <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground mb-3">Loading audit logs…</div>}
          <div className="space-y-2">
            {filteredAudits.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl bg-muted/20 border border-border/30 p-3 hover:bg-muted/30 transition-colors">
                <div className="mt-1 h-2 w-2 rounded-full shrink-0 bg-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{a.user}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary">{a.action}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{a.module}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(a.time).toLocaleString("en-GB")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsAudit;


