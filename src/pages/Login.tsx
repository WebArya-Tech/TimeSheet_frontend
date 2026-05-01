import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { login } from "@/lib/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Eye, EyeOff, AlertCircle, ArrowRight, Mail, Lock, Shield, Users, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/axios";

const Login = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "forgot" | "reset" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [signupForm, setSignupForm] = useState({
    full_name: "",
    email: "",
    password: "",
    department: "",
    designation: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await dispatch(login({ email, password })).unwrap();
      toast({ title: "Welcome back", description: "Successfully logged in." });
    } catch (err: any) {
      setError(err || "Invalid credentials. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/forgot-password", { email });
      const token = res.data?.reset_token || "";
      setResetToken(token);
      setMode("reset");
      toast({ title: "Reset token generated", description: "Use the token to set a new password." });
    } catch (err: any) {
      toast({ title: "Forgot password failed", description: err?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/reset-password", { token: resetToken, new_password: newPassword });
      toast({ title: "Password reset successful", description: "Please login with your new password." });
      setMode("login");
      setNewPassword("");
      setResetToken("");
    } catch (err: any) {
      toast({ title: "Reset failed", description: err?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/signup", signupForm);
      toast({ title: "Signup successful", description: "You can now login with your account." });
      setEmail(signupForm.email);
      setPassword(signupForm.password);
      setMode("login");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err?.response?.data?.detail || "Network error", variant: "destructive" });
    }
  };

  const features = [
    { icon: Clock, text: "Track daily hours effortlessly" },
    { icon: BarChart3, text: "Real-time analytics & reports" },
    { icon: Users, text: "Team management & approvals" },
    { icon: Shield, text: "Enterprise-grade security" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding panel */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden gradient-primary">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TimeSheet Pro</h1>
              <p className="text-xs text-white/60">Enterprise Edition v1.0</p>
            </div>
          </div>

          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
                Smart Time<br />Management<br />
                <span className="text-white/70">Made Simple.</span>
              </h2>
              <p className="text-lg text-white/60 leading-relaxed">
                Track hours, manage projects, and streamline approvals — all in one powerful platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.07] backdrop-blur-sm p-3 transition-all hover:bg-white/[0.12]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-white/80">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
<div className="pt-8 flex items-center gap-4 text-xs text-white/40">
            <span>© 2026 TimeSheet Pro</span>
            <span>•</span>
            <span>Prepared by Yadvendra</span>
          </div>
        </div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-8 relative">
        {/* Mobile branding */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg">
            <Clock className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">TimeSheet Pro</span>
        </div>

        <div className="w-full max-w-[420px] animate-slide-up">
          <div className="mb-8 mt-12 lg:mt-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {mode === "forgot" && "Reset Password"}
              {mode === "reset" && "Set New Password"}
              {mode === "signup" && "Create Account"}
              {mode === "login" && "Welcome back"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "forgot" && "Enter your email to receive a reset token"}
              {mode === "reset" && "Set your new password using reset token"}
              {mode === "signup" && "Create your account and start tracking time"}
              {mode === "login" && "Sign in to your account to continue"}
            </p>
          </div>

          {mode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email" type="email" placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Generate Reset Token
              </Button>
              <Button type="button" variant="ghost" className="w-full h-10" onClick={() => setMode("login")}>
                ← Back to sign in
              </Button>
            </form>
          ) : mode === "reset" ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reset token</Label>
                <Input value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="h-12 rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">New password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 rounded-xl" required />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">Reset Password</Button>
              <Button type="button" variant="ghost" className="w-full h-10" onClick={() => setMode("login")}>← Back to sign in</Button>
            </form>
          ) : mode === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <Input placeholder="Full name" value={signupForm.full_name} onChange={(e) => setSignupForm((s) => ({ ...s, full_name: e.target.value }))} className="h-12 rounded-xl" required />
              <Input type="email" placeholder="Email" value={signupForm.email} onChange={(e) => setSignupForm((s) => ({ ...s, email: e.target.value }))} className="h-12 rounded-xl" required />
              <Input type="password" placeholder="Password" value={signupForm.password} onChange={(e) => setSignupForm((s) => ({ ...s, password: e.target.value }))} className="h-12 rounded-xl" required />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Department" value={signupForm.department} onChange={(e) => setSignupForm((s) => ({ ...s, department: e.target.value }))} className="h-12 rounded-xl" />
                <Input placeholder="Designation" value={signupForm.designation} onChange={(e) => setSignupForm((s) => ({ ...s, designation: e.target.value }))} className="h-12 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm">Create Account</Button>
              <Button type="button" variant="ghost" className="w-full h-10" onClick={() => setMode("login")}>← Back to sign in</Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive animate-scale-in">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPassword ? "text" : "password"}
                    placeholder="Enter your password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    className="pl-10 pr-10 h-12 rounded-xl"
                  />
                  <button
                    type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox id="remember" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary font-medium hover:underline" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all gap-2" disabled={loading}>
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full h-10" onClick={() => setMode("signup")}>
                New user? Create account
              </Button>

              {/* Demo accounts */}
              {/* <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Demo Accounts</p>
                <div className="space-y-2">
                  {[
                    { label: "Super Admin", email: "superadmin@example.com", pass: "superadminpassword", color: "bg-chart-5/10 text-chart-5" },
                    { label: "Admin", email: "admin@company.com", pass: "demo", color: "bg-info/10 text-info" },
                    { label: "User", email: "user@company.com", pass: "demo", color: "bg-success/10 text-success" },
                  ].map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      className="w-full flex items-center justify-between rounded-lg bg-card border border-border/50 p-3 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
                      onClick={() => { setEmail(account.email); setPassword(account.pass); }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${account.color}`}>
                          {account.label}
                        </span>
                        <span className="text-sm text-muted-foreground">{account.email}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-primary transition-all" />
                    </button>
                  ))}
                </div>
              </div> */}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;


