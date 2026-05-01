import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Search, Edit, FolderKanban, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchProjects } from "@/lib/features/projects/projectSlice";
import api from "@/lib/axios";

type Project = {
  id: string;
  project_code: string;
  name: string;
  expected_completion_date: string;
  status: string;
  billable_type: string;
};

const emptyCreate = {
  project_code: "",
  name: "",
  expected_completion_date: "",
  billable_type: "Billable",
  status: "Active",
};

const Projects = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector((state) => state.projects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState({ name: "", expected_completion_date: "", billable_type: "Billable", status: "Active" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.project_code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const openEdit = (p: Project) => {
    setEditingProject(p);
    setEditForm({
      name: p.name,
      expected_completion_date: p.expected_completion_date?.split("T")[0] || "",
      billable_type: p.billable_type,
      status: p.status,
    });
    setEditOpen(true);
  };

  const createProject = async () => {
    if (!createForm.project_code || !createForm.name || !createForm.expected_completion_date) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/projects", createForm);
      toast({ title: "Project created successfully" });
      setCreateOpen(false);
      setCreateForm(emptyCreate);
      dispatch(fetchProjects());
    } catch (e: any) {
      toast({ title: "Failed to create project", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateProject = async () => {
    if (!editingProject) return;
    setSaving(true);
    try {
      await api.put(`/projects/${editingProject.id}`, editForm);
      toast({ title: "Project updated successfully" });
      setEditOpen(false);
      setEditingProject(null);
      dispatch(fetchProjects());
    } catch (e: any) {
      toast({ title: "Failed to update project", description: e?.response?.data?.detail || "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Projects</h1>
          <p className="page-subheader mt-1">Manage project master data and assignments</p>
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-bold">Create Project</DialogTitle>
              <DialogDescription>Fill in the details to create a new project.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><FolderKanban className="h-3 w-3" /> Project Code *</Label>
                  <Input value={createForm.project_code} onChange={(e) => setCreateForm((s) => ({ ...s, project_code: e.target.value }))} placeholder="e.g. PA001" className="rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={createForm.status} onValueChange={(v) => setCreateForm((s) => ({ ...s, status: v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project Name *</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} placeholder="Project name" className="rounded-xl h-10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expected Completion *</Label>
                  <Input type="date" value={createForm.expected_completion_date} onChange={(e) => setCreateForm((s) => ({ ...s, expected_completion_date: e.target.value }))} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Billable Type</Label>
                  <Select value={createForm.billable_type} onValueChange={(v) => setCreateForm((s) => ({ ...s, billable_type: v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Billable">Billable</SelectItem>
                      <SelectItem value="Non-Billable">Non-Billable</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={createProject} disabled={saving}>
                {saving ? "Creating…" : "Save Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
          <DialogContent className="w-full max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-bold">Edit Project — {editingProject?.project_code}</DialogTitle>
              <DialogDescription>Update the project details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project Name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} className="rounded-xl h-10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expected Completion</Label>
                  <Input type="date" value={editForm.expected_completion_date} onChange={(e) => setEditForm((s) => ({ ...s, expected_completion_date: e.target.value }))} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((s) => ({ ...s, status: v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Billable Type</Label>
                <Select value={editForm.billable_type} onValueChange={(v) => setEditForm((s) => ({ ...s, billable_type: v }))}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Billable">Billable</SelectItem>
                    <SelectItem value="Non-Billable">Non-Billable</SelectItem>
                    <SelectItem value="Internal">Internal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={updateProject} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] rounded-xl h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="card-hover overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading projects…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No projects found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="table-header">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Project Name</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Exp. Completion</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Billable</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{p.project_code}</td>
                      <td className="px-4 py-3 font-semibold">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {p.expected_completion_date ? new Date(p.expected_completion_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${p.billable_type === "Billable" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{p.billable_type}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => openEdit(p as Project)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Projects;
