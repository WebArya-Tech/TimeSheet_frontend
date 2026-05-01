import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Calendar, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";

type HistoryItem = {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  total_hours: number;
};

const TimesheetHistory = () => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<HistoryItem[]>("/timesheets/history/me");
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((h) => h.status.toLowerCase() === statusFilter);
  }, [items, statusFilter]);

  return (
  <div className="space-y-5">
    <div>
      <h1 className="page-header">Timesheet History</h1>
      <p className="page-subheader mt-1">View and manage your past timesheets</p>
    </div>

    <div className="flex flex-wrap gap-3">
      <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[160px] rounded-xl h-10"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="returned">Returned</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent>
      </Select>
    </div>
    {loading && <div className="text-sm text-muted-foreground">Loading history…</div>}

    <div className="space-y-3">
      {filtered.map((h) => (
        <Card key={h.id} className="card-hover overflow-hidden">
          <div className={`h-1 ${h.status === "Approved" ? "gradient-success" : h.status === "Returned" ? "gradient-warning" : "bg-muted"}`} />
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">{new Date(h.week_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} – {new Date(h.week_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <div className="flex items-center gap-3 mt-1">
                  <StatusBadge status={h.status} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {h.total_hours}h / 40h
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Progress bar */}
              <div className="hidden sm:flex items-center gap-2 mr-4">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${h.total_hours >= 40 ? "gradient-success" : "gradient-primary"}`} style={{ width: `${Math.min((h.total_hours / 40) * 100, 100)}%` }} />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{Math.round((h.total_hours / 40) * 100)}%</span>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs">
                {h.status === "Returned" ? <><Edit className="h-3 w-3" /> Edit</> : <><Eye className="h-3 w-3" /> View</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
};

export default TimesheetHistory;


