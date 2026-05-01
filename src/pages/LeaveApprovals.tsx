import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { CheckCircle2, XCircle, Eye, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

type LeaveApproval = {
    id: string;
    user?: {
        id: string;
        full_name: string;
        email: string;
        employee_code: string;
    };
    leave_type: string;
    from_date: string;
    to_date: string;
    days: number;
    reason: string;
    status: string;
    applied_on: string;
    approver_comment?: string;
};

const statusBadgeMap: Record<string, string> = {
    pending: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
};

const LeaveApprovals = () => {
    const { toast } = useToast();
    const { user } = useAppSelector((state) => state.auth);
    const [leaves, setLeaves] = useState<LeaveApproval[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const loadLeaves = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<LeaveApproval[]>("/leaves/pending");
            setLeaves(Array.isArray(data) ? data : []);
            if (data && data.length > 0 && !expandedId) setExpandedId(data[0].id);
        } catch (err: any) {
            toast({
                title: "Failed to load leave approvals",
                description: err?.response?.data?.detail || "Network error",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaves();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAction = async (leave: LeaveApproval, action: "approved" | "rejected") => {
        try {
            await api.put(`/leaves/${leave.id}/status`, {
                status: action,
                approver_comment: comments[leave.id] || (action === "approved" ? "Approved by admin" : "Rejected by admin"),
            });
            toast({ title: `Leave ${action}`, description: `${leave.user?.full_name || "Employee"}'s leave was ${action}.` });
            setLeaves((prev) => prev.filter((item) => item.id !== leave.id));
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
                <h1 className="page-header">Leave Approvals</h1>
                <p className="page-subheader mt-1">Review and approve pending leave requests from your team.</p>
            </div>

            {loading && <div className="text-sm text-muted-foreground">Loading pending leave requests…</div>}

            {leaves.length === 0 && !loading ? (
                <Card>
                    <CardContent className="py-16 text-center text-muted-foreground">
                        No pending leave requests found.
                    </CardContent>
                </Card>
            ) : (
                leaves.map((leave) => (
                    <Card key={leave.id} className="card-hover overflow-hidden">
                        <div className="h-1 gradient-primary" />
                        <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedId(expandedId === leave.id ? null : leave.id)}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <CardTitle className="text-base font-bold">{leave.user?.full_name || "Unknown User"}</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {leave.user?.employee_code || ""} · {leave.user?.email || ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {((user?.role?.toLowerCase() === "admin" && leave.user?.role?.role_name?.toLowerCase() === "user") || 
                                      (user?.role?.toLowerCase() === "super_admin" && leave.user?.role?.role_name?.toLowerCase() === "admin")) && (
                                        <div className="flex items-center gap-2 mr-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                className="h-8 w-8 p-0 rounded-full text-success hover:bg-success/10" 
                                                onClick={(e) => { e.stopPropagation(); handleAction(leave, "approved"); }}
                                            >
                                                <CheckCircle2 className="h-5 w-5" />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost"
                                                className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10" 
                                                onClick={(e) => { e.stopPropagation(); handleAction(leave, "rejected"); }}
                                            >
                                                <XCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                    <StatusBadge status={statusBadgeMap[leave.status] || leave.status} />
                                    <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === leave.id ? "rotate-90" : ""}`} />
                                </div>
                            </div>
                        </CardHeader>

                        {expandedId === leave.id && (
                            <CardContent className="space-y-4 animate-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Leave Type</p>
                                        <p className="font-semibold mt-1">{leave.leave_type}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">From</p>
                                        <p className="font-semibold mt-1">{leave.from_date}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">To</p>
                                        <p className="font-semibold mt-1">{leave.to_date}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Days</p>
                                        <p className="font-semibold mt-1">{leave.days}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Applied On</p>
                                        <p className="font-semibold mt-1">{leave.applied_on}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 border border-border/50 p-3">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Status</p>
                                        <p className="font-semibold mt-1">{statusBadgeMap[leave.status] || leave.status}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Reason</p>
                                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{leave.reason}</p>
                                </div>

                                <div className="space-y-2">
                                    <Textarea
                                        value={comments[leave.id] || leave.approver_comment || ""}
                                        onChange={(e) => setComments({ ...comments, [leave.id]: e.target.value })}
                                        placeholder="Add approval comment..."
                                        rows={3}
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {((user?.role?.toLowerCase() === "admin" && leave.user?.role?.role_name?.toLowerCase() === "user") || 
                                      (user?.role?.toLowerCase() === "super_admin" && leave.user?.role?.role_name?.toLowerCase() === "admin")) && (
                                        <>
                                            <Button size="sm" className="gap-2 rounded-xl gradient-success text-success-foreground shadow" onClick={() => handleAction(leave, "approved")}>
                                                <CheckCircle2 className="h-4 w-4" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" className="gap-2 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => handleAction(leave, "rejected")}>
                                                <XCircle className="h-4 w-4" /> Reject
                                            </Button>
                                        </>
                                    )}
                                    <Button size="sm" variant="ghost" className="gap-2 rounded-xl" onClick={() => setExpandedId(leave.id === expandedId ? null : leave.id)}>
                                        <Eye className="h-4 w-4" /> {expandedId === leave.id ? "Collapse" : "Details"}
                                    </Button>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                ))
            )}
        </div>
    );
};

export default LeaveApprovals;
