import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

type AttendanceApproval = {
    id: string;
    user?: {
        id: string;
        full_name: string;
        email?: string;
        employee_code?: string;
    };
    date: string;
    status: string;
    check_in?: string | null;
    check_out?: string | null;
    hours?: number | null;
    note?: string | null;
    approval_status: string;
    approver_comment?: string | null;
};

const statusBadgeMap: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
};

const AttendanceApprovals = () => {
    const { toast } = useToast();
    const { user } = useAppSelector((state) => state.auth);
    const [records, setRecords] = useState<AttendanceApproval[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<AttendanceApproval[]>("/attendances/pending");
            const list = Array.isArray(data) ? data : [];
            setRecords(list);
            if (list.length > 0 && !expandedId) setExpandedId(list[0].id);
        } catch (err: any) {
            toast({
                title: "Failed to load attendance approvals",
                description: err?.response?.data?.detail || "Network error",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh]);

    const handleAction = async (record: AttendanceApproval, action: "approved" | "rejected") => {
        try {
            // Using a standard status update payload that works with most backends
            await api.put(`/attendances/${record.id}/status`, {
                status: action,
                approval_status: action,
                approver_comment: comments[record.id] || `Attendance ${action} by admin.`,
            });
            toast({ title: `Attendance ${action}`, description: `${record.user?.full_name || "Employee"}'s attendance was ${action}.` });
            setRefresh(prev => prev + 1);
        } catch (err: any) {
            toast({
                title: "Action failed",
                description: err?.response?.data?.detail || "Network error",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="page-header">Attendance Approvals</h1>
                <p className="page-subheader mt-1">Review daily attendance records flagged for admin review.</p>
                {user?.role?.toLowerCase() === "admin" && (
                    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 mt-3 text-sm text-warning-foreground">
                        Admins can approve attendance only for regular team members. Super-admins have read-only visibility and do not perform approvals.
                    </div>
                )}
                {user?.role?.toLowerCase() === "super_admin" && (
                    <div className="rounded-2xl border border-success/30 bg-success/10 p-3 mt-3 text-sm text-success-foreground">
                        Super admins have full visibility across the system but do not perform approvals.
                    </div>
                )}
            </div>

            {loading && <div className="text-sm text-muted-foreground">Loading pending attendance records…</div>}

            {!loading && records.length === 0 && (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">No pending attendance approvals found.</CardContent>
                </Card>
            )}

            {records.map((record) => (
                <Card key={record.id} className="card-hover overflow-hidden">
                    <div className="h-1 gradient-info" />
                    <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <CardTitle className="text-base font-bold">{record.user?.full_name || "Unknown Employee"}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {record.user?.employee_code || ""} · {record.date}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {((user?.role?.toLowerCase() === "admin" && record.user?.role?.role_name?.toLowerCase() === "user") || 
                                  (user?.role?.toLowerCase() === "super_admin" && record.user?.role?.role_name?.toLowerCase() === "admin")) && (
                                    <div className="flex items-center gap-2 mr-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            className="h-8 w-8 p-0 rounded-full text-success hover:bg-success/10" 
                                            onClick={(e) => { e.stopPropagation(); handleAction(record, "approved"); }}
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10" 
                                            onClick={(e) => { e.stopPropagation(); handleAction(record, "rejected"); }}
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </Button>
                                    </div>
                                )}
                                <StatusBadge status={statusBadgeMap[record.approval_status] || record.approval_status} />
                                <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === record.id ? "rotate-90" : ""}`} />
                            </div>
                        </div>
                    </CardHeader>

                    {expandedId === record.id && (
                        <CardContent className="space-y-4 animate-slide-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
                                    <p className="font-semibold mt-1 capitalize">{record.status}</p>
                                </div>
                                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Approval State</p>
                                    <p className="font-semibold mt-1">{statusBadgeMap[record.approval_status] || record.approval_status}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Check In</p>
                                    <p className="font-semibold mt-1">{record.check_in || "—"}</p>
                                </div>
                                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Check Out</p>
                                    <p className="font-semibold mt-1">{record.check_out || "—"}</p>
                                </div>
                                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Hours</p>
                                    <p className="font-semibold mt-1">{record.hours ?? "—"}</p>
                                </div>
                            </div>

                            {record.note && (
                                <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Note</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{record.note}</p>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Admin Comment</label>
                                <Textarea
                                    value={comments[record.id] || record.approver_comment || ""}
                                    onChange={(e) => setComments({ ...comments, [record.id]: e.target.value })}
                                    placeholder="Add approval comment..."
                                    rows={3}
                                    className="rounded-xl"
                                />
                            </div>

                            {((user?.role?.toLowerCase() === "admin" && record.user?.role?.role_name?.toLowerCase() === "user") || 
                              (user?.role?.toLowerCase() === "super_admin" && record.user?.role?.role_name?.toLowerCase() === "admin")) && (
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" className="gap-2 rounded-xl gradient-success text-success-foreground shadow" onClick={() => handleAction(record, "approved")}>
                                        <CheckCircle2 className="h-4 w-4" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="gap-2 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => handleAction(record, "rejected")}>
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

export default AttendanceApprovals;
