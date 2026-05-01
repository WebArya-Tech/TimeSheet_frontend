import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, Filter, Search, Calendar, User, 
  Clock, CheckCircle2, AlertCircle, FileText 
} from "lucide-react";
import { format } from "date-fns";

type ActivityItem = {
  id: string;
  type: "Attendance" | "Leave" | "Timesheet" | "DailyEntry" | "Approval";
  date: string;
  user_id: string;
  user_name: string;
  status?: string;
  detail: string;
  approval_status?: string;
  project_name?: string;
  target_user_name?: string;
  created_at: string;
};

const GlobalActivityView = () => {
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roleFilter, setRoleFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadActivities = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ActivityItem[]>("/system/global-activity", {
        params: {
          start_date: fromDate,
          end_date: toDate,
          department: deptFilter || undefined,
          role_name: roleFilter || undefined,
        },
      });
      setActivities(data);
    } catch (e: any) {
      toast({
        title: "Error loading activities",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "super_admin") {
      loadActivities();
    }
  }, [fromDate, toDate, roleFilter, deptFilter]);

  const filteredActivities = activities.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      a.user_name.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      a.detail.toLowerCase().includes(q) ||
      (a.project_name?.toLowerCase().includes(q))
    );
  });

  if (!user || user.role !== "super_admin") {
    return (
      <div className="p-10 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">Only Super Admins can view global activity.</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Attendance": return <Clock className="h-4 w-4 text-blue-500" />;
      case "Leave": return <Calendar className="h-4 w-4 text-orange-500" />;
      case "Timesheet": return <FileText className="h-4 w-4 text-green-500" />;
      case "DailyEntry": return <Activity className="h-4 w-4 text-purple-500" />;
      case "Approval": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="page-header">Global Activity Monitor</h1>
        <p className="page-subheader mt-1">Real-time visibility across all system events and user actions.</p>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Date From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Date To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Role</label>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none">
                <option value="">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input placeholder="User, project..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none" />
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={loadActivities} className="w-full rounded-xl bg-primary text-primary-foreground h-[38px] text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2">
                <Filter className="h-4 w-4" /> Refresh
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Unified Activity Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Detail</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">Loading...</td></tr>
                ) : filteredActivities.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-3">{getActivityIcon(item.type)} <span className="text-sm font-semibold">{item.type}</span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium">{item.user_name}</span></td>
                    <td className="px-6 py-4"><div className="text-sm text-foreground/80 max-w-xs truncate">{item.detail}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={(item.status || item.approval_status || "pending").toLowerCase()} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">{format(new Date(item.created_at), "MMM d, HH:mm")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalActivityView;