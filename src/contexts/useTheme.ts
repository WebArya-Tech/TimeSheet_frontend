import { useContext } from "react";
import { ThemeContext } from "./theme-context";
import { ThemeProvider } from "./ThemeContext";

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
};

export { ThemeProvider };
