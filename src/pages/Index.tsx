import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/lib/hooks";

const Index = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default Index;

