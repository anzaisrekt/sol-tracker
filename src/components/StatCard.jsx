import { TrendingUp, TrendingDown } from "lucide-react";

const accentClasses = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  accentColor = "primary",
  subtext,
}) {
  const isPositive = change > 0;
  const changeColor =
    change === 0 || change === undefined
      ? "text-base-content/70"
      : isPositive
        ? "text-success"
        : "text-error";
      const iconClasses = accentClasses[accentColor] || accentClasses.primary;

  return (
    <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all group">
      <div className="card-body p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconClasses}`}
            >
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-base-content mb-1">{value}</div>
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${changeColor}`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : change < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              {change > 0 ? "+" : ""}
              {change?.toFixed(2)}%
            </span>
          )}
          {subtext && <span className="text-xs text-base-content/70">{subtext}</span>}
        </div>
      </div>
    </div>
  );
}
