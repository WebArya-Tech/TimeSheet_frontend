import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { Users, FolderKanban, Plus, Settings, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

type AssignmentUser = {
  id: string;
  full_name: string;
  employee_code: string;
  department?: string;
};
type AssignmentItem = {
  project_id: string;
  project_code: string;
  project_name: string;
  expected_completion_date: string;
  status: string;
  users: AssignmentUser[];
};
type ApiUser = { id: string; full_name: string; employee_code: string; department?: string; designation?: string };
type ApiProject = { id: string; name: string; project_code: string; status: string };

const Assignments = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [allUsers, setAllUsers] = useState<ApiUser[]>([]);
  const [allProjects, setAllProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "users">("projects");
  
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [currentProject, setCurrentProject] = useState<AssignmentItem | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [assRes, userRes, projRes] = await Promise.all([
        api.get<AssignmentItem[]>("/projects/assignments"),
        api.get<any[]>("/users"),
        api.get<ApiProject[]>("/projects"),
      ]);
      setItems(Array.isArray(assRes.data) ? assRes.data : []);
      setAllUsers(Array.isArray(userRes.data) ? userRes.data : []);
      setAllProjects(Array.isArray(projRes.data) ? projRes.data : []);
    } catch (e: any) {
      toast({
        title: "Failed to load assignments",
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

  // Manage by Project
  const openManageProject = (item: AssignmentItem) => {
    setCurrentProject(item);
    setSelectedUsers(item.users.map((u) => u.id));
    setOpenProjectDialog(true);
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveProjectAssignments = async () => {
    if (!currentProject) return;
    try {
      await api.put(`/projects/${currentProject.project_id}/assignments`, { user_ids: selectedUsers });
      toast({ title: "Project assignments updated" });
      setOpenProjectDialog(false);
      await loadAll();
    } catch (e: any) {
      toast({ title: "Failed to update", description: e?.response?.data?.detail, variant: "destructive" });
    }
  };

  // Manage by User
  const usersWithProjects = useMemo(() => {
    return allUsers.map(u => {
      const assignedProjects = items.filter(i => i.users.some(au => au.id === u.id));
      return { ...u, projects: assignedProjects };
    });
  }, [allUsers, items]);

  const openManageUser = (u: any) => {
    setCurrentUser(u);
    setSelectedProjects(u.projects.map((p: any) => p.project_id));
    setOpenUserDialog(true);
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedProjects((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveUserAssignments = async () => {
    if (!currentUser) return;
    try {
      await api.put(`/projects/assignments/user/${currentUser.id}`, { project_ids: selectedProjects });
      toast({ title: "User project assignments updated" });
      setOpenUserDialog(false);
      await loadAll();
    } catch (e: any) {
      toast({ title: "Failed to update", description: e?.response?.data?.detail, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-header">Project Assignments</h1>
        <p className="page-subheader mt-1">Manage user-to-project assignments (Multi-project support)</p>
      </div>

      <div className="flex p-1 bg-muted/30 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab("projects")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "projects" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          By Project
        </button>
        <button 
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "users" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          By User
        </button>
      </div>

      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading assignments…</div>}
      
      {activeTab === "projects" ? (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.project_id} className="card-hover overflow-hidden">
              <div className="h-1 gradient-primary" />
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{a.project_name}</p>
                        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{a.project_code}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Deadline: {a.expected_completion_date ? new Date(a.expected_completion_date).toLocaleDateString("en-GB") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {a.users.length} members
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {a.users.map((u) => (
                    <span key={u.id} className="inline-flex items-center gap-1.5 rounded-xl bg-muted border border-border/50 px-2.5 py-1 text-xs font-medium">
                      {u.full_name}
                    </span>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => openManageProject(a)} className="gap-1.5 rounded-xl">
                  <Settings className="h-3.5 w-3.5" /> Manage Users
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {usersWithProjects.map((u) => (
            <Card key={u.id} className="card-hover overflow-hidden">
              <div className="h-1 gradient-info" />
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-info/10">
                      <Users className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.employee_code} · {u.department || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {u.projects.length} project(s) assigned
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {u.projects.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No projects assigned</span>
                  ) : (
                    u.projects.map((p) => (
                      <span key={p.project_id} className="inline-flex items-center gap-1.5 rounded-xl bg-muted border border-border/50 px-2.5 py-1 text-xs font-medium">
                        {p.project_name}
                      </span>
                    ))
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => openManageUser(u)} className="gap-1.5 rounded-xl">
                  <FolderKanban className="h-3.5 w-3.5" /> Assign Projects
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manage Project Dialog */}
      <Dialog open={openProjectDialog} onOpenChange={setOpenProjectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Manage Project Users</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Assigning users to <strong>{currentProject?.project_name}</strong></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-auto pr-1">
              {allUsers.map((u) => {
                const active = selectedUsers.includes(u.id);
                return (
                  <button key={u.id} onClick={() => toggleUserSelection(u.id)} className={`text-left rounded-xl border p-3 ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <p className="text-sm font-semibold">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.employee_code}</p>
                  </button>
                );
              })}
            </div>
            <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={saveProjectAssignments}>Save Assignments</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage User Dialog */}
      <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Assign Projects to User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Assigning projects to <strong>{currentUser?.full_name}</strong></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-auto pr-1">
              {allProjects.map((p) => {
                const active = selectedProjects.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggleProjectSelection(p.id)} className={`text-left rounded-xl border p-3 ${active ? "border-info bg-info/5" : "border-border hover:border-info/30"}`}>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.project_code}</p>
                  </button>
                );
              })}
            </div>
            <Button className="w-full rounded-xl gradient-info text-white" onClick={saveUserAssignments}>Save Assignments</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assignments;



