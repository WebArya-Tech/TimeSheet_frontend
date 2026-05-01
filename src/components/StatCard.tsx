import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "primary" | "success" | "warning" | "info" | "destructive";
}

const gradientMap = {
  primary: "gradient-primary",
  success: "gradient-success",
  warning: "gradient-warning",
  info: "gradient-info",
  destructive: "gradient-destructive",
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "primary" }: StatCardProps) => (
  <div className="stat-card group">
    <div className="flex items-start justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
        {subtitle && (
          <div className="flex items-center gap-1.5">
            {trend && trend !== "neutral" && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === "up" ? "text-success" : "text-destructive"}`}>
                {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendValue}
              </span>
            )}
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        )}
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${gradientMap[color]} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
    </div>
  </div>
);

export default StatCard;
