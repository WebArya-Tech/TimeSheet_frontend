import { useEffect, useMemo, useState, useCallback } from "react";
import { useAppSelector } from "@/lib/hooks";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Users, Briefcase, Calendar, Shield, ChevronRight, ChevronDown } from "lucide-react";

type OrgUser = {
  id: string;
  full_name: string;
  employee_code: string;
  department?: string | null;
  designation?: string | null;
  role?: string | null;
  children?: OrgUser[];
};

type OrgTree = {
  admin: OrgUser;
  users: OrgUser[];
}[];

type Snapshot = {
  user: OrgUser & { reporting_admin_id?: string | null };
  projects: Array<{
    id: string;
    project_code: string;
    name: string;
    expected_completion_date: string | null;
    status: string;
    billable_type: string;
  }>;
  leaves: Array<any>;
  attendances: Array<any>;
  daily_timesheet_entries: Array<any>;
  weekly_timesheets: Array<any>;
  approval_logs: Array<any>;
};

const OrgView = () => {
  const { toast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

  const [hierarchicalTree, setHierarchicalTree] = useState<OrgUser[]>([]);
  const [functionalTree, setFunctionalTree] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);

  const [activeTab, setActiveTab] = useState<"hierarchical" | "functional">("hierarchical");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const { data } = await api.get<{ hierarchical_tree: OrgUser[]; functional_tree: any[] }>("/system/org-tree");
      setHierarchicalTree(data.hierarchical_tree || []);
      setFunctionalTree(data.functional_tree || []);
    } catch (e: any) {
      toast({
        title: "Failed to load organization",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setLoadingTree(false);
    }
  }, [toast]);

  const loadSnapshot = useCallback(async (targetUserId: string) => {
    try {
      const { data } = await api.get<Snapshot>("/system/user-visibility", {
        params: {
          user_id: targetUserId,
          from_date: fromDate,
          to_date: toDate,
        },
      });
      setSnapshot(data);
    } catch (e: any) {
      toast({
        title: "Failed to load user visibility",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    }
  }, [fromDate, toDate, toast]);

  useEffect(() => {
    if (user?.role !== "super_admin") return;
    loadTree();
  }, [user, loadTree]);

  useEffect(() => {
    if (selectedUserId) loadSnapshot(selectedUserId);
  }, [selectedUserId, loadSnapshot]);

  const TreeNode = ({ node, level = 0 }: { node: OrgUser; level?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="space-y-1">
        <button
          onClick={() => {
            setSelectedUserId(node.id);
            if (hasChildren) setExpanded(!expanded);
          }}
          className={`w-full text-left flex items-center gap-2 p-2 rounded-lg transition-colors ${
            selectedUserId === node.id ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/50"
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <div className="w-4" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{node.full_name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{node.designation || "User"}</div>
          </div>
          <StatusBadge status={node.role || "user"} size="sm" />
        </button>
        {hasChildren && expanded && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            {node.children?.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;
  if (user.role !== "super_admin") {
    return (
      <div className="space-y-4">
        <h1 className="page-header">Organization Structure</h1>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Access denied. This page is available to SUPER_ADMIN only.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-header">Organization Structure</h1>
        <p className="page-subheader mt-1">SUPER_ADMIN read-only visibility across users, projects, activities and approval logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4" /> Structure
              </CardTitle>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setActiveTab("hierarchical")}
                className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg transition-colors ${activeTab === "hierarchical" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                Hierarchical
              </button>
              <button 
                onClick={() => setActiveTab("functional")}
                className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 rounded-lg transition-colors ${activeTab === "functional" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                Functional
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Activity Range</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-xs"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-2 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="max-h-[600px] overflow-auto pr-1 space-y-1">
              {loadingTree ? (
                <div className="text-sm text-muted-foreground py-4 text-center">Loading organization…</div>
              ) : activeTab === "hierarchical" ? (
                hierarchicalTree.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">No structure found.</div>
                ) : (
                  hierarchicalTree.map((root) => (
                    <TreeNode key={root.id} node={root} />
                  ))
                )
              ) : (
                functionalTree.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">No functional groups found.</div>
                ) : (
                  functionalTree.map((dept, idx) => (
                    <div key={idx} className="space-y-1 mb-4">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2 px-2">{dept.department}</div>
                      {dept.users.map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`w-full text-left p-2 rounded-lg transition-colors ${
                            selectedUserId === u.id ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-muted/50"
                          }`}
                        >
                          <div className="font-bold text-sm truncate">{u.full_name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{u.designation || "User"}</div>
                        </button>
                      ))}
                    </div>
                  ))
                )
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Eye className="h-4 w-4" /> User Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!snapshot ? (
                <div className="text-sm text-muted-foreground">Select a user to view details.</div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="text-lg font-extrabold">{snapshot.user.full_name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {snapshot.user.employee_code} · {snapshot.user.department || "—"} · {snapshot.user.designation || "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Role</div>
                      <div className="font-semibold mt-1">{snapshot.user.role || "—"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/60 bg-card p-3">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Briefcase className="h-4 w-4" /> Projects
                      </div>
                      <div className="mt-2 space-y-2">
                        {snapshot.projects.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No project assignments.</div>
                        ) : (
                          snapshot.projects.slice(0, 6).map((p) => (
                            <div key={p.id} className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold">{p.project_code} · {p.name}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {p.billable_type} · Expected: {p.expected_completion_date || "—"}
                                </div>
                              </div>
                              <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {p.status}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card p-3">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Calendar className="h-4 w-4" /> Activity Summary
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-muted/20 p-3">
                          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Leave</div>
                          <div className="text-lg font-extrabold mt-1">{snapshot.leaves.length}</div>
                        </div>
                        <div className="rounded-xl bg-muted/20 p-3">
                          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Attendance</div>
                          <div className="text-lg font-extrabold mt-1">{snapshot.attendances.length}</div>
                        </div>
                        <div className="rounded-xl bg-muted/20 p-3">
                          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Daily Entries</div>
                          <div className="text-lg font-extrabold mt-1">{snapshot.daily_timesheet_entries.length}</div>
                        </div>
                        <div className="rounded-xl bg-muted/20 p-3">
                          <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Weekly</div>
                          <div className="text-lg font-extrabold mt-1">{snapshot.weekly_timesheets.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-card p-3">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Shield className="h-4 w-4" /> Approval Logs
                      </div>
                      <div className="mt-2 space-y-2 max-h-[220px] overflow-auto pr-1">
                        {snapshot.approval_logs.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No approval logs in this range.</div>
                        ) : (
                          snapshot.approval_logs.slice(0, 12).map((l: any) => (
                            <div key={l.id} className="flex items-start justify-between gap-3 rounded-xl bg-muted/20 p-3">
                              <div>
                                <div className="text-sm font-bold">{l.action} · <span className="text-muted-foreground">{l.module}</span></div>
                                <div className="text-[11px] text-muted-foreground mt-1">{l.detail || ""}</div>
                              </div>
                              <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {l.time ? new Date(l.time).toLocaleString() : ""}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border/60 bg-card p-3">
                        <div className="font-bold text-sm">Leaves</div>
                        <div className="mt-2 space-y-2 max-h-[220px] overflow-auto pr-1">
                          {snapshot.leaves.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No leaves.</div>
                          ) : (
                            snapshot.leaves.slice(0, 10).map((l: any) => (
                              <div key={l.id} className="rounded-xl bg-muted/20 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-semibold">{l.type}</div>
                                  <div className="text-[11px] text-muted-foreground">{l.status}</div>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1">
                                  {l.from} → {l.to} · {l.days} days
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-card p-3">
                        <div className="font-bold text-sm">Attendance</div>
                        <div className="mt-2 space-y-2 max-h-[220px] overflow-auto pr-1">
                          {snapshot.attendances.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No attendance records.</div>
                          ) : (
                            snapshot.attendances.slice(0, 10).map((r: any) => (
                              <div key={r.id} className="rounded-xl bg-muted/20 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-sm font-semibold">{r.date}</div>
                                  <div className="text-[11px] text-muted-foreground">{r.approval_status || r.approvalStatus}</div>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1">
                                  {r.check_in || "—"} → {r.check_out || "—"} · {r.hours ?? "—"}h
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card p-3">
                      <div className="font-bold text-sm">Daily Timesheet Entries (sample)</div>
                      <div className="mt-2 overflow-x-auto max-h-[240px] overflow-y-auto pr-1">
                        {snapshot.daily_timesheet_entries.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No daily entries.</div>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="table-header">
                                <th className="px-3 py-2.5 text-left rounded-l-lg">Date</th>
                                <th className="px-3 py-2.5 text-left">Type</th>
                                <th className="px-3 py-2.5 text-left">Project / Activity</th>
                                <th className="px-3 py-2.5 text-right rounded-r-lg">Hours</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {snapshot.daily_timesheet_entries.slice(0, 18).map((e: any, idx: number) => (
                                <tr key={`${e.id || idx}-${idx}`} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{new Date(e.date).toLocaleDateString("en-GB")}</td>
                                  <td className="px-3 py-2.5 font-semibold">{e.entry_type || "—"}</td>
                                  <td className="px-3 py-2.5">{e.project_or_activity || e.project_name || e.category_name || "—"}</td>
                                  <td className="px-3 py-2.5 text-right font-bold">{e.hours}h</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrgView;