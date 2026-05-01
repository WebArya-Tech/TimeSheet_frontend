import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Search, Edit, Mail, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchUsers } from "@/lib/features/users/userSlice";

type ApiRole = { id: string; role_name: "SUPER_ADMIN" | "ADMIN" | "USER"; status: string };
type ApiUser = {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  status: string;
  department?: string | null;
  designation?: string | null;
  role_id?: string | null;
  reporting_admin_id?: string | null;
  role?: { role_name: "SUPER_ADMIN" | "ADMIN" | "USER" };
};
type UsersMeta = {
  roles: ApiRole[];
  admins: { id: string; full_name: string; employee_code: string }[];
};

const mapRoleToLabel = (roleName?: string) => {
  if (roleName === "SUPER_ADMIN") return "Super Admin";
  if (roleName === "ADMIN") return "Admin";
  return "User";
};

const UserManagement = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector((state) => state.users);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [meta, setMeta] = useState<UsersMeta>({ roles: [], admins: [] });
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    full_name: "",
    employee_code: "",
    email: "",
    department: "",
    designation: "",
    role_id: "",
    reporting_admin_id: "",
    password: "demo",
    status: "Active",
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    department: "",
    designation: "",
    role_id: "",
    reporting_admin_id: "",
    status: "Active",
  });

  const loadMeta = async () => {
    setMetaLoading(true);
    try {
      const metaRes = await api.get<UsersMeta>("/users/meta");
      setMeta(metaRes.data || { roles: [], admins: [] });
    } catch (e: any) {
      toast({
        title: "Failed to load roles/admins",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchUsers());
    loadMeta();
  }, [dispatch]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const roleLabel = mapRoleToLabel(u?.role?.role_name).toLowerCase();
      const matchesSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.employee_code.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || roleLabel === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const openEdit = (u: any) => {
    setEditingUser(u as ApiUser);
    setEditForm({
      full_name: u.full_name,
      department: u.department || "",
      designation: u.designation || "",
      role_id: u.role_id || (u.role?.id ?? ""),
      reporting_admin_id: u.reporting_admin_id || "",
      status: u.status || "Active",
    });
    setEditOpen(true);
  };

  const createUser = async () => {
    if (!createForm.full_name || !createForm.email || !createForm.employee_code || !createForm.role_id) {
      toast({ title: "Please fill all required fields (Name, Email, Code, Role)", variant: "destructive" });
      return;
    }
    try {
      await api.post("/users", {
        ...createForm,
        reporting_admin_id: createForm.reporting_admin_id || null,
      });
      toast({ title: "User created successfully" });
      setCreateOpen(false);
      setCreateForm({
        full_name: "",
        employee_code: "",
        email: "",
        department: "",
        designation: "",
        role_id: "",
        reporting_admin_id: "",
        password: "demo",
        status: "Active",
      });
      await loadMeta();
      dispatch(fetchUsers());
    } catch (e: any) {
      toast({
        title: "Failed to create user",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;
    try {
      await api.put(`/users/${editingUser.id}`, {
        full_name: editForm.full_name,
        department: editForm.department || null,
        designation: editForm.designation || null,
        role_id: editForm.role_id || undefined,
        reporting_admin_id: editForm.reporting_admin_id || null,
      });
      await api.put(`/users/${editingUser.id}/status?status=${encodeURIComponent(editForm.status)}`);
      toast({ title: "User updated successfully" });
      setEditOpen(false);
      setEditingUser(null);
      await loadMeta();
      dispatch(fetchUsers());
    } catch (e: any) {
      toast({
        title: "Failed to update user",
        description: e?.response?.data?.detail || "Network error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">User Management</h1>
          <p className="page-subheader mt-1">Create, edit and manage user accounts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25"><Plus className="h-4 w-4" /> Add User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-bold">Create User</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label><Input value={createForm.full_name} onChange={(e) => setCreateForm((s) => ({ ...s, full_name: e.target.value }))} placeholder="Full name" className="rounded-xl h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Employee Code</Label><Input value={createForm.employee_code} onChange={(e) => setCreateForm((s) => ({ ...s, employee_code: e.target.value }))} placeholder="EMP000" className="rounded-xl h-10" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))} placeholder="email@company.com" className="rounded-xl h-10" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</Label><Input value={createForm.department} onChange={(e) => setCreateForm((s) => ({ ...s, department: e.target.value }))} placeholder="Engineering" className="rounded-xl h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Designation</Label><Input value={createForm.designation} onChange={(e) => setCreateForm((s) => ({ ...s, designation: e.target.value }))} placeholder="Software Engineer" className="rounded-xl h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Password</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))} placeholder="Password" className="rounded-xl h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label><Input value={createForm.status} onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))} placeholder="Active" className="rounded-xl h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
                  <Select value={createForm.role_id} onValueChange={(v) => setCreateForm((s) => ({ ...s, role_id: v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {meta.roles.map((r) => <SelectItem key={r.id} value={r.id}>{mapRoleToLabel(r.role_name)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reporting Admin</Label>
                  <Select value={createForm.reporting_admin_id || "none"} onValueChange={(v) => setCreateForm((s) => ({ ...s, reporting_admin_id: v === "none" ? "" : v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select admin" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {meta.admins.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={createUser}>Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-bold">Edit User</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label><Input value={editForm.full_name} onChange={(e) => setEditForm((s) => ({ ...s, full_name: e.target.value }))} className="rounded-xl h-10" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Department</Label><Input value={editForm.department} onChange={(e) => setEditForm((s) => ({ ...s, department: e.target.value }))} className="rounded-xl h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Designation</Label><Input value={editForm.designation} onChange={(e) => setEditForm((s) => ({ ...s, designation: e.target.value }))} className="rounded-xl h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
                  <Select value={editForm.role_id || "none"} onValueChange={(v) => setEditForm((s) => ({ ...s, role_id: v === "none" ? "" : v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No change</SelectItem>
                      {meta.roles.map((r) => <SelectItem key={r.id} value={r.id}>{mapRoleToLabel(r.role_name)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={editForm.status} onValueChange={(v) => setEditForm((s) => ({ ...s, status: v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reporting Admin</Label>
                <Select value={editForm.reporting_admin_id || "none"} onValueChange={(v) => setEditForm((s) => ({ ...s, reporting_admin_id: v === "none" ? "" : v }))}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select admin" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {meta.admins.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full rounded-xl gradient-primary text-primary-foreground" onClick={updateUser}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl h-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px] rounded-xl h-10"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading users…</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <Card key={u.id} className="card-hover overflow-hidden">
            <div className={`h-1 ${u.status === "Active" ? "gradient-success" : "bg-muted"}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground shadow">
                    {u.full_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.designation || mapRoleToLabel(u.role?.role_name)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => openEdit(u)}><Edit className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" /> {u.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-3 w-3" /> {u.department || "—"} · {u.employee_code}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="flex gap-2">
                  <StatusBadge status={u.status} />
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${u.role?.role_name === "ADMIN" ? "bg-info/10 text-info" : u.role?.role_name === "SUPER_ADMIN" ? "bg-chart-5/10 text-chart-5" : "bg-success/10 text-success"}`}>{mapRoleToLabel(u.role?.role_name)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{meta.admins.find((a) => a.id === u.reporting_admin_id)?.full_name || "—"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};

export default UserManagement;


