import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Clock, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

type ApiNotification = {
  id: string;
  type: "reminder" | "warning" | "success" | "info" | "error";
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
};

const iconMap = {
  reminder: Clock,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  error: XCircle,
};

const colorMap = {
  reminder: "text-primary",
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
  error: "text-destructive",
};

const Notifications = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const unread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiNotification[]>("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({
        title: "Failed to load notifications",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e: any) {
      toast({ title: "Failed to mark all read", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  const markRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;
    try {
      if (!target.is_read) {
        await api.put(`/notifications/${id}/read`);
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      }
      // navigate if link available
      if (target.link) {
        // If link looks like an internal route (starts with '/'), use navigate
        if (target.link.startsWith('/')) {
          navigate(target.link);
        } else {
          // otherwise open in new tab
          window.open(target.link, '_blank');
        }
      }
    } catch (e: any) {
      toast({ title: "Failed to mark read", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Notifications</h1>
          <p className="page-subheader mt-1">
            {unread > 0 ? `${unread} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={markAllRead}>
            <CheckCircle2 className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {loading && <div className="text-sm text-muted-foreground">Loading notifications…</div>}
        {notifications.map((n) => (
          (() => {
            const Icon = iconMap[n.type] || Bell;
            const color = colorMap[n.type] || "text-primary";
            const timeLabel = new Date(n.created_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <Card
                key={n.id}
                className={`card-hover overflow-hidden cursor-pointer ${!n.is_read ? "border-primary/20" : ""}`}
                onClick={() => markRead(n.id)}
              >
                {!n.is_read && <div className="h-0.5 gradient-primary" />}
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${!n.is_read ? "gradient-primary shadow" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${!n.is_read ? "text-primary-foreground" : color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.is_read ? "font-bold" : "font-medium"}`}>{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 rounded-full gradient-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    {n.link && <p className="text-xs text-primary mt-1">Open: {n.link}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1.5">{timeLabel}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })()
        ))}
      </div>
    </div>
  );
};

export default Notifications;


