import { useState } from "react";
import AppSidebar from "./AppSidebar";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`transition-all duration-300 ${collapsed ? "lg:pl-[72px]" : "lg:pl-[270px]"}`}>
        <div className="pt-16 lg:pt-0 p-4 sm:p-6 lg:p-8 max-w-[1520px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
