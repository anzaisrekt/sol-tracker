import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { RefreshCw, Search, Bell, Globe, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePortfolio } from "../lib/portfolio-context";
import {
  getRecentTransactionsWithTypes,
  shortenAddress,
  timeAgo,
} from "../lib/solana";

export default function Header() {
  const {
    loading,
    refreshPortfolio,
    setManualWallet,
    isDemo,
    lastRefresh,
    activeAddress,
  } = usePortfolio();
  const { publicKey, connected } = useWallet();
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTransactions, setNotificationTransactions] = useState([]);
  const connectedAddress = connected ? publicKey?.toBase58() : "";

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      if (!connectedAddress) {
        setNotificationTransactions([]);
        return;
      }

      try {
        const txns = await getRecentTransactionsWithTypes(connectedAddress, 5);
        if (!cancelled) {
          setNotificationTransactions(txns);
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationTransactions([]);
        }
        console.error("Notification fetch error:", error);
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [connectedAddress]);

  const handleSearch = (e) => {
    e.preventDefault();
    const address = searchInput.trim();
    if (address.length >= 32 && address.length <= 44) {
      setManualWallet(address);
      setShowSearch(false);
      setSearchInput("");
      refreshPortfolio(address);
    }
  };

  const handleRefresh = () => {
    setShowNotifications(false);
    refreshPortfolio(activeAddress);
  };

  const clearTrackedWallet = () => {
    setManualWallet("");
    setShowSearch(false);
    setSearchInput("");
  };

  return (
    <header className="h-16 border-b border-base-300 bg-base-200/90 backdrop-blur-md flex items-center justify-between px-3 md:px-6 sticky top-0 z-30 text-base-content">
      <div className="flex items-center gap-4">
        <label
          htmlFor="app-drawer"
          className="btn btn-ghost btn-sm btn-square lg:hidden drawer-button"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </label>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="px-2 py-0.5 text-xs rounded-full badge badge-warning badge-outline">
              Demo Mode
            </span>
          )}
          {activeAddress && !isDemo && (
            <span className="px-2 py-0.5 text-xs rounded-full badge badge-success badge-outline">
              Live Data
            </span>
          )}
        </div>

        {activeAddress && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-base-content min-w-0">
            <Globe className="w-3 h-3 text-base-content/70" />
            <span className="font-mono truncate max-w-[110px] md:max-w-xs">
              {shortenAddress(activeAddress, 6)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search / Lookup wallet */}
        {showSearch ? (
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Solana address..."
              className="w-72 max-w-[55vw] px-3 py-1.5 text-sm bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-base-content placeholder:text-base-content/50"
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-sm btn-primary btn-outline"
            >
              Track
            </button>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="text-base-content/70 hover:text-base-content text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={clearTrackedWallet}
              className="text-base-content/70 hover:text-base-content text-sm"
            >
              Use wallet
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-base-content/70 bg-base-100 border border-base-300 rounded-lg hover:border-primary/30 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lookup wallet</span>
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={loading || !activeAddress}
          className="p-2 rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-100 transition-colors disabled:opacity-50"
          title={
            lastRefresh
              ? `Last synced: ${lastRefresh.toLocaleTimeString()}`
              : "Sync wallet"
          }
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>

        {/* Notifications */}
        {connectedAddress && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications((open) => !open)}
              className="p-2 rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-100 transition-colors relative"
              title="Recent activity"
            >
              <Bell className="w-4 h-4" />
              {notificationTransactions.some((tx) => tx.type === "Failed") && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-base-300 bg-base-200 shadow-xl overflow-hidden z-40">
                <div className="px-4 py-3 border-b border-base-300">
                  <div className="text-sm font-medium text-base-content">
                    Recent activity
                  </div>
                  <div className="text-xs text-base-content/70 mt-0.5">
                    Latest portfolio updates and transactions
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationTransactions.length > 0 ? (
                    notificationTransactions.map((tx) => {
                      const isFailed = tx.type === "Failed";
                      return (
                        <div
                          key={tx.signature}
                          className="px-4 py-3 border-b border-base-300/50 last:border-b-0 flex items-start gap-3"
                        >
                          <div
                            className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${isFailed ? "bg-error" : "bg-success"}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${isFailed ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}
                              >
                                {tx.type}
                              </span>
                              <span className="text-[11px] text-base-content/70">
                                {tx.blockTime ? timeAgo(tx.blockTime) : ""}
                              </span>
                            </div>
                            <p className="text-xs text-base-content/70 mt-2 truncate">
                              {tx.description || tx.signature}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-4 text-sm text-base-content/70">
                      No recent activity.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wallet Connect */}
        <div className="wallet-adapter-button-trigger">
          <WalletMultiButton
            style={{
              backgroundColor: "#9945FF",
              fontSize: "13px",
              height: "36px",
              borderRadius: "8px",
              padding: "0 16px",
            }}
          />
        </div>
      </div>
    </header>
  );
}
