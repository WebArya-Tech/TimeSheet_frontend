import { useAppSelector } from "@/lib/hooks";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return null;

  switch (user.role?.toLowerCase()) {
    case "super_admin": return <SuperAdminDashboard />;
    case "admin": return <AdminDashboard />;
    default: return <UserDashboard />;
  }
};

export default Dashboard;

