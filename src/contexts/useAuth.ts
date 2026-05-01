import { useContext } from "react";
import { AuthContext } from "./auth-context";
import { AuthProvider } from "./AuthContext";

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

export { AuthProvider };
