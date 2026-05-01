import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logout } from "@/lib/features/auth/authSlice";
import { UserRole } from "@/contexts/auth-types";
import { useTheme } from "@/contexts/useTheme";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Clock, CalendarDays, History, CheckSquare, FolderKanban,
  Users, Settings, Shield, FileText, Bell, LogOut, Menu, X, Tag,
  BarChart3, ClipboardList, ChevronRight, ChevronLeft, Moon, Sun, CalendarCheck,
  Activity,
} from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: UserRole[];
  section?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["user", "admin", "super_admin"], section: "Overview" },
  { label: "Attendance", icon: CalendarCheck, path: "/attendance", roles: ["user", "admin"], section: "Overview" },
  { label: "Leave Management", icon: CalendarDays, path: "/leaves", roles: ["user", "admin"], section: "Overview" },
  { label: "Daily Timesheet", icon: Clock, path: "/daily-entry", roles: ["user"], section: "Timesheet" },
  { label: "Weekly Submission", icon: CalendarDays, path: "/weekly-submission", roles: ["user"], section: "Timesheet" },
  { label: "History", icon: History, path: "/history", roles: ["user"], section: "Timesheet" },
  { label: "Projects", icon: FolderKanban, path: "/projects", roles: ["admin", "super_admin"], section: "Management" },
  { label: "Assignments", icon: ClipboardList, path: "/assignments", roles: ["admin"], section: "Management" },
  { label: "Pending Approvals", icon: CheckSquare, path: "/approvals", roles: ["admin", "super_admin"], section: "Management" },
  { label: "Leave Approvals", icon: CalendarDays, path: "/leave-approvals", roles: ["admin", "super_admin"], section: "Management" },
  { label: "Attendance Approvals", icon: CheckSquare, path: "/attendance-approvals", roles: ["admin", "super_admin"], section: "Management" },
  { label: "Team Timesheets", icon: CalendarDays, path: "/team-timesheets", roles: ["admin"], section: "Management" },
  { label: "Admins", icon: Shield, path: "/admins", roles: ["super_admin"], section: "Administration" },
  { label: "Users", icon: Users, path: "/users", roles: ["super_admin", "admin"], section: "Administration" },
  { label: "Categories", icon: Tag, path: "/categories", roles: ["super_admin"], section: "Administration" },
  { label: "Holidays", icon: CalendarDays, path: "/holidays", roles: ["super_admin"], section: "Administration" },
  { label: "Reports", icon: BarChart3, path: "/reports", roles: ["admin", "super_admin"], section: "Analytics" },
  { label: "Global Activity", icon: Activity, path: "/global-activity", roles: ["super_admin"], section: "Analytics" },
  { label: "Settings", icon: Settings, path: "/settings", roles: ["super_admin"], section: "System" },
  { label: "Audit Logs", icon: FileText, path: "/audit", roles: ["super_admin"], section: "System" },
  { label: "Organization Structure", icon: Users, path: "/org-view", roles: ["super_admin"], section: "Administration" },
  { label: "Notifications", icon: Bell, path: "/notifications", roles: ["user", "admin", "super_admin"], section: "System" },
];

const roleLabels: Record<UserRole, string> = { super_admin: "Super Admin", admin: "Admin", user: "Employee" };
const roleBadgeColors: Record<UserRole, string> = {
  super_admin: "bg-chart-5/20 text-chart-5",
  admin: "bg-info/20 text-info",
  user: "bg-success/20 text-success",
};

const AppSidebar = ({ collapsed, setCollapsed }: AppSidebarProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const handleLogout = () => dispatch(logout());
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));
  const sections: { name: string; items: typeof filteredNav }[] = [];
  filteredNav.forEach((item) => {
    const existing = sections.find((s) => s.name === (item.section || ""));
    if (existing) existing.items.push(item);
    else sections.push({ name: item.section || "", items: [item] });
  });

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[270px]";

  const SidebarBody = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-4 py-5 border-b border-sidebar-border`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25">
          <Clock className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-sidebar-foreground truncate">TimeSheet Pro</h2>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${roleBadgeColors[user.role]}`}>
              {roleLabels[user.role]}
            </span>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-16 z-50 h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.name}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-muted">
                {section.name}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    title={collapsed ? item.label : undefined}
                    className={`sidebar-link w-full group ${collapsed ? "justify-center px-2" : ""} ${active ? "sidebar-link-active" : "sidebar-link-inactive"}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                    {!collapsed && active && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme toggle + User footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all ${collapsed ? "justify-center px-2" : ""}`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {/* User info */}
        {!collapsed && (
          <div
            className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3 cursor-pointer hover:bg-sidebar-accent/70 transition-colors"
            onClick={() => { navigate("/profile"); setMobileOpen(false); }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-primary-foreground shadow">
              {user.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">{user.employeeCode} · {user.department}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost" size="sm"
          className={`w-full gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-xl ${collapsed ? "justify-center" : "justify-start"}`}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full ${sidebarWidth} bg-sidebar transition-all duration-300 ease-out lg:translate-x-0 ${mobileOpen ? "translate-x-0 w-[270px]" : "-translate-x-full"
          } lg:block`}
      >
        <SidebarBody />
      </aside>
    </>
  );
};

export default AppSidebar;


