import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePortfolio } from "../lib/portfolio-context";
import { formatUSD } from "../lib/solana";

const TIME_RANGES = [
  { label: "30D", key: "30D", ms: 30 * 24 * 60 * 60 * 1000 },
];

function getBucketSizeMs(rangeKey) {
  if (rangeKey === "30D") return 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

function bucketHistory(points, rangeKey) {
  const bucketMs = getBucketSizeMs(rangeKey);
  const byBucket = new Map();

  for (const point of points) {
    const ts = Number(point.ts);
    if (!Number.isFinite(ts)) continue;

    const bucketTs = Math.floor(ts / bucketMs) * bucketMs;
    const existing = byBucket.get(bucketTs);
    if (!existing || ts > existing.ts) {
      byBucket.set(bucketTs, { ts, value: Number(point.value) || 0, bucketTs });
    }
  }

  return [...byBucket.values()]
    .sort((a, b) => a.bucketTs - b.bucketTs)
    .map((entry) => ({ timestamp: entry.bucketTs, value: entry.value }));
}

function formatXAxisLabel(timestamp, rangeKey) {
  const d = new Date(timestamp);
  if (!Number.isFinite(d.getTime())) return "";

  if (rangeKey === "30D") {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
}

export default function PortfolioChart() {
  const {
    historicalChartData,
    refreshPortfolio,
    activeAddress,
    isLoading,
  } = usePortfolio();
  const [range, setRange] = useState("30D");

  if (isLoading) {
    return (
      <div className="skeleton w-full h-[250px] rounded-xl"></div>
    );
  }

  const hasHistoricalData =
    Array.isArray(historicalChartData) && historicalChartData.length > 0;

  if (!hasHistoricalData) {
    return (
      <div className="bg-base-200 border border-base-300 rounded-xl p-5">
        <h3 className="text-sm font-medium text-base-content/70 mb-4">
          Portfolio Value
        </h3>
        <div className="flex items-center justify-center h-[250px] text-sm text-base-content/70">
          No chart data available
        </div>
      </div>
    );
  }

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
    if (activeAddress) {
      refreshPortfolio(activeAddress);
    }
  };

  const now = Date.now();
  const selectedRange =
    TIME_RANGES.find((r) => r.key === range) || TIME_RANGES[0];
  const startTime = now - selectedRange.ms;

  const normalizedHistory = (historicalChartData || [])
    .map((entry) => {
      const ts = Number(entry.timestamp) || new Date(entry.date).getTime();
      return {
        ...entry,
        ts,
        value: Number(entry.totalPortfolioValue ?? entry.value) || 0,
      };
    })
    .filter((entry) => Number.isFinite(entry.ts) && entry.ts >= startTime)
    .sort((a, b) => a.ts - b.ts);

  const rawData = bucketHistory(normalizedHistory, selectedRange.key) || [];
  const data =
    rawData.length === 1
      ? Array.from({ length: 30 }, (_, idx) => {
          const baseTs = rawData[0].timestamp;
          const dayMs = 24 * 60 * 60 * 1000;
          const ts = baseTs - (29 - idx) * dayMs;
          return { timestamp: ts, value: rawData[0].value };
        })
      : rawData;

  if (!data || data.length === 0) {
    return (
      <div className="bg-base-200 border border-base-300 rounded-xl p-5">
        <h3 className="text-sm font-medium text-base-content/70 mb-4">
          Portfolio Value
        </h3>
        <div className="flex items-center justify-center h-[250px] text-sm text-base-content/70">
          No chart data available
        </div>
      </div>
    );
  }

  const values = (data || []).map((d) => d.value);
  const minVal = Math.min(...values) * 0.98;
  const maxVal = Math.max(...values) * 1.02;
  const isPositive =
    data.length >= 2 && data[data.length - 1].value >= data[0].value;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-base-300 border border-base-300 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-base-content/70 mb-1">
            {formatXAxisLabel(label, selectedRange.key)}
          </p>
          <p className="text-sm font-semibold text-base-content">
            {formatUSD(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-base-200 border border-base-300 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-base-content/70 mb-1">
            Portfolio Value
          </h3>
              {data.length > 0 && (
            <p className="text-xl font-bold text-base-content">
              {formatUSD(data[data.length - 1]?.value || 0)}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {(TIME_RANGES || []).map((r) => (
            <button
              key={r.key}
              onClick={() => handleRangeChange(r.key)}
              className={`px-3 py-1 text-xs rounded-md transition-colors
                ${
                  range === r.key
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-300 border border-transparent"
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="portfolioGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={isPositive ? "#14F195" : "#ef4444"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "#14F195" : "#ef4444"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e2030"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickCount={
                8
              }
              tick={{ fontSize: 11, fill: "#6b7280" }}
              interval="preserveStartEnd"
              minTickGap={36}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => {
                return formatXAxisLabel(val, selectedRange.key);
              }}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatUSD(val)}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#14F195" : "#ef4444"}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
