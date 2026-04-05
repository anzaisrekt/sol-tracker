import { useMemo } from "react";
import { Wallet, Coins, Image, Layers, TrendingUp } from "lucide-react";
import { usePortfolio } from "../lib/portfolio-context";
import { formatUSD, timeAgo } from "../lib/solana";
import StatCard from "../components/StatCard";
import PortfolioChart from "../components/PortfolioChart";
import AllocationChart from "../components/AllocationChart";
import TokenRow from "../components/TokenRow";

export default function Dashboard() {
  const {
    totalValue,
    solBalance,
    tokens,
    nfts,
    cnfts,
    defiPositions,
    transactions,
    loading,
    isLoading,
    dailyPnLPercentage,
    isDemo,
    error,
  } = usePortfolio();

  const nftCount = nfts.length + cnfts.length;
  const defiTotal = defiPositions.reduce((sum, d) => sum + d.value, 0);
  const syncedPortfolioValue = formatUSD(totalValue);
  const sortedHoldings = useMemo(() => {
    return [...tokens].sort(
      (a, b) => b.amount * b.price - a.amount * a.price,
    );
  }, [tokens]);

  const MetricSkeleton = () => (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-5">
        <div className="skeleton h-3 w-24 mb-3" />
        <div className="skeleton h-8 w-1/2 mb-3" />
        <div className="skeleton h-3 w-20" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-base-content">Demo Mode</p>
            <p className="text-xs text-base-content/70">
              Connect your wallet or enter a Solana address to see live
              portfolio data. Showing sample data.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-sm text-base-content">
          <p className="font-medium text-error">
            Portfolio data could not be fully refreshed.
          </p>
          <p className="mt-1 text-base-content/70">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Portfolio"
              value={syncedPortfolioValue}
              change={dailyPnLPercentage}
              icon={TrendingUp}
              accentColor="primary"
              subtext="24h"
            />
            <StatCard
              title="Token Holdings"
              value={syncedPortfolioValue}
              icon={Coins}
              accentColor="primary"
              subtext={`${tokens.length} tokens`}
            />
            <StatCard
              title="NFT Collected"
              value={`${nftCount} NFTs`}
              icon={Image}
              accentColor="info"
            />
            <StatCard
              title="DeFi Value"
              value={formatUSD(defiTotal)}
              icon={Layers}
              accentColor="primary"
              subtext={`${defiPositions.length} positions`}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PortfolioChart isLoading={isLoading} />
        </div>
        <AllocationChart isLoading={isLoading} />
      </div>

      {/* Top Tokens & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Tokens Table */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="skeleton h-64 w-full" />
          ) : (
            <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-base-300">
                <h3 className="text-sm font-medium text-base-content">
                  All Holdings
                </h3>
              </div>
              <div className="max-h-[30rem] overflow-auto">
                <table className="table table-zebra table-pin-rows w-full">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 text-xs text-base-content/70 font-medium text-left">
                        #
                      </th>
                      <th className="py-2 px-4 text-xs text-base-content/70 font-medium text-left">
                        Token
                      </th>
                      <th className="py-2 px-4 text-xs text-base-content/70 font-medium text-right">
                        Balance
                      </th>
                      <th className="py-2 px-4 text-xs text-base-content/70 font-medium text-right">
                        Price
                      </th>
                      <th className="py-2 px-4 text-xs text-base-content/70 font-medium text-right">
                        Value
                      </th>
                      <th className="py-2 px-4 text-xs text-base-content/70 font-medium text-right">
                        24h
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHoldings.map((token, i) => (
                      <TokenRow key={token.mint} token={token} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          {isLoading ? (
            <div className="skeleton h-64 w-full" />
          ) : (
            <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-base-300">
                <h3 className="text-sm font-medium text-base-content">
                  Recent Activity
                </h3>
              </div>
              <div className="max-h-[30rem] overflow-auto">
                <table className="table table-zebra table-pin-rows w-full">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th className="text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i}>
                        <td>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              tx.status === "success"
                                ? "bg-success/10 text-success"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="max-w-[220px] truncate text-xs text-base-content/80">
                          {tx.description}
                        </td>
                        <td className="text-right text-xs text-base-content/70">
                          {tx.blockTime ? timeAgo(tx.blockTime) : ""}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-sm text-base-content/70">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
