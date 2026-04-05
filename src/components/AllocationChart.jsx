import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { usePortfolio } from "../lib/portfolio-context";
import { formatUSD } from "../lib/solana";

const COLORS = [
  "#9945FF",
  "#14F195",
  "#00C2FF",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

export default function AllocationChart({ isLoading: isLoadingProp }) {
  const { tokens, isLoading: isLoadingContext } = usePortfolio();
  const isLoading = typeof isLoadingProp === "boolean" ? isLoadingProp : isLoadingContext;

  if (isLoading) {
    return (
      <div className="skeleton w-full h-[250px] rounded-xl"></div>
    );
  }

  if (!tokens || !Array.isArray(tokens)) {
    return (
      <div className="bg-base-200 border border-base-300 rounded-xl p-5">
        <h3 className="text-sm font-medium text-base-content/70 mb-4">Allocation</h3>
        <div className="flex items-center justify-center h-[250px] text-sm text-base-content/70">
          No token data available
        </div>
      </div>
    );
  }

  const data = (tokens || [])
    .map((t) => ({
      name: t.symbol,
      value: t.amount * t.price,
    }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (!data || data.length === 0) {
    return (
      <div className="bg-base-200 border border-base-300 rounded-xl p-5">
        <h3 className="text-sm font-medium text-base-content/70 mb-4">Allocation</h3>
        <div className="flex items-center justify-center h-[250px] text-sm text-base-content/70">
          No priced assets available
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const item = payload[0];
      return (
        <div className="bg-base-300 border border-base-300 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-base-content">{item.name}</p>
          <p className="text-xs text-base-content/70">
            {formatUSD(item.value)} ({((item.value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-base-200 border border-base-300 rounded-xl p-5">
      <h3 className="text-sm font-medium text-base-content/70 mb-4">Allocation</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {(data || []).map((_, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {(data || []).map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-base-content/70">{item.name}</span>
            <span className="text-base-content ml-auto">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
