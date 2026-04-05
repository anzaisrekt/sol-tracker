import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { usePortfolio } from "../lib/portfolio-context";
import { timeAgo } from "../lib/solana";

const TX_TYPES = [
  "All",
  "Swap",
  "Send",
  "Received",
  "Stake",
  "NFT Buy",
  "LP Deposit",
  "Claim",
  "Transaction",
  "Failed",
];

export default function Transactions() {
  const { transactions, isLoading } = usePortfolio();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((tx) => {
    if (filter !== "All" && tx.type !== filter) return false;
    if (
      search &&
      !tx.signature?.toLowerCase().includes(search.toLowerCase()) &&
      !tx.description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-base-content">Transaction History</h1>
        {isLoading ? (
          <div className="skeleton h-5 w-56 mt-2" />
        ) : (
          <p className="text-sm text-base-content/70 mt-1">
            {transactions.length} recent transactions
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-base-200 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-base-content placeholder:text-base-content/50"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {TX_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors
                ${
                  filter === type
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-base-content/70 bg-base-200 border border-base-300 hover:border-primary/20"
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">
            <div className="skeleton h-12 w-full mb-2" />
            <div className="skeleton h-12 w-full mb-2" />
            <div className="skeleton h-12 w-full mb-2" />
            <div className="skeleton h-12 w-full mb-2" />
            <div className="skeleton h-12 w-full mb-2" />
          </div>
        ) : (
          <div className="max-h-[36rem] overflow-auto">
            <table className="table table-zebra table-pin-rows w-full">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-right">Time</th>
                  <th className="text-right">Link</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => {
                  const isFailed = tx.type === "Failed" || tx.status === "failed";

                  return (
                    <tr key={i}>
                      <td>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isFailed ? "bg-error/10 text-error" : "bg-success/10 text-success"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="max-w-[380px] truncate text-sm text-base-content/80">
                        {tx.description}
                      </td>
                      <td>
                        <span className="text-xs text-base-content/70">
                          {tx.confirmationStatus || (isFailed ? "failed" : "success")}
                        </span>
                      </td>
                      <td className="text-right text-xs text-base-content/70">
                        {tx.blockTime ? timeAgo(tx.blockTime) : ""}
                      </td>
                      <td className="text-right">
                        <a
                          href={`https://solscan.io/tx/${tx.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-xs"
                          title="View on Solscan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-base-content/70">
                      No transactions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
