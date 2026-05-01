import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, Building2, Briefcase, Shield, Camera, Save, Lock, Eye, EyeOff, CheckCircle2, Edit3, X, Calendar,
} from "lucide-react";

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+91 98765 43210",
    department: user?.department || "",
    designation: user?.designation || "",
    bio: "Passionate software engineer with 5+ years of experience in full-stack development.",
    location: "Bangalore, India",
    joinDate: "15 Mar 2023",
    timezone: "Asia/Kolkata",
  });

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
      toast({ title: "Profile picture updated" });
    }
  };

  const handleSaveProfile = () => {
    setEditing(false);
    toast({ title: "Profile updated successfully", description: "Your changes have been saved." });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters required", variant: "destructive" });
      return;
    }
    setChangingPassword(false);
    setPasswords({ old: "", new: "", confirm: "" });
    toast({ title: "Password changed successfully" });
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("") || "U";

  const infoFields = [
    { label: "Employee Code", value: user?.employeeCode, icon: Shield },
    { label: "Department", value: form.department, icon: Building2 },
    { label: "Designation", value: form.designation, icon: Briefcase },
    { label: "Join Date", value: form.joinDate, icon: Calendar },
    { label: "Location", value: form.location, icon: Building2 },
    { label: "Timezone", value: form.timezone, icon: Calendar },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">My Profile</h1>
          <p className="page-subheader mt-1">Manage your account information</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)} className="gap-2 rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Edit3 className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)} className="gap-2 rounded-xl">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="gap-2 rounded-xl gradient-primary text-primary-foreground">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Avatar + Identity Card */}
      <Card className="overflow-hidden">
        <div className="h-32 gradient-primary relative">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }} />
        </div>
        <CardContent className="relative pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            <div className="relative group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-28 w-28 rounded-2xl border-4 border-card object-cover shadow-xl" />
              ) : (
                <div className="h-28 w-28 rounded-2xl border-4 border-card gradient-primary flex items-center justify-center shadow-xl">
                  <span className="text-3xl font-extrabold text-primary-foreground">{initials}</span>
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-extrabold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.designation} · {user?.department}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  user?.role === "super_admin" ? "bg-chart-5/15 text-chart-5" :
                  user?.role === "admin" ? "bg-info/15 text-info" : "bg-success/15 text-success"
                }`}>
                  {user?.role === "super_admin" ? "Super Admin" : user?.role === "admin" ? "Admin" : "Employee"}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-medium text-success">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info Form */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!editing} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!editing} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!editing} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} disabled={!editing} className="pl-10 h-11 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} disabled={!editing} rows={3} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })} disabled={!editing}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Engineering", "Design", "QA", "Management", "HR", "Finance"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Timezone</Label>
                <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })} disabled={!editing}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Singapore"].map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info + Password */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {infoFields.map((f) => (
                <div key={f.label} className="flex items-center gap-3 rounded-xl bg-muted/30 border border-border/50 p-3">
                  <f.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm font-medium text-foreground truncate">{f.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" /> Password & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!changingPassword ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                  <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => setChangingPassword(true)}>
                    <Lock className="h-4 w-4" /> Change Password
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Current Password</Label>
                    <div className="relative">
                      <Input type={showOld ? "text" : "password"} value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} className="pr-10 rounded-xl h-10" required />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowOld(!showOld)}>
                        {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">New Password</Label>
                    <div className="relative">
                      <Input type={showNew ? "text" : "password"} value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="pr-10 rounded-xl h-10" required />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Confirm Password</Label>
                    <div className="relative">
                      <Input type={showConfirm ? "text" : "password"} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="pr-10 rounded-xl h-10" required />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {passwords.new && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Password Strength</p>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${passwords.new.length >= 12 ? "w-full bg-success" : passwords.new.length >= 8 ? "w-2/3 bg-warning" : "w-1/3 bg-destructive"}`} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{passwords.new.length >= 12 ? "Strong" : passwords.new.length >= 8 ? "Medium" : "Weak"}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => setChangingPassword(false)}>Cancel</Button>
                    <Button type="submit" size="sm" className="flex-1 rounded-xl gradient-primary text-primary-foreground">Update</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;


