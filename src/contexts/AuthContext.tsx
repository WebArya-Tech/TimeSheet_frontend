import { useCallback, useState } from "react";

import { AuthContext } from "./auth-context";
import type { AuthUser } from "./auth-types";

const mockUsers: Record<string, AuthUser> = {
  "super@company.com": {
    id: "1", name: "Rohit Gupta", email: "super@company.com",
    employeeCode: "SA001", role: "super_admin", department: "Management", designation: "CTO",
  },
  "admin@company.com": {
    id: "2", name: "Priya Sharma", email: "admin@company.com",
    employeeCode: "ADM001", role: "admin", department: "Engineering", designation: "Project Manager",
  },
  "user@company.com": {
    id: "3", name: "Amit Kumar", email: "user@company.com",
    employeeCode: "EMP001", role: "user", department: "Engineering", designation: "Software Engineer",
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback(async (email: string, _password: string) => {
    const found = mockUsers[email.toLowerCase()];
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

