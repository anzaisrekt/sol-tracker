import { usePortfolio } from '../lib/portfolio-context'
import { formatUSD } from '../lib/solana'
import { Layers, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'

export default function DeFi() {
  const { defiPositions, isLoading } = usePortfolio()

  const totalValue = defiPositions.reduce((sum, d) => sum + d.value, 0)
  const totalPnL = defiPositions.reduce((sum, d) => sum + (d.pnl || 0), 0)

  const byType = defiPositions.reduce((acc, pos) => {
    if (!acc[pos.type]) acc[pos.type] = []
    acc[pos.type].push(pos)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-base-content">DeFi Positions</h1>
        {isLoading ? (
          <div className="skeleton h-5 w-72 mt-2" />
        ) : (
          <p className="text-sm text-base-content/70 mt-1">
            {defiPositions.length} active positions · Total: {formatUSD(totalValue)}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-5">
                <div className="skeleton h-3 w-32 mb-4" />
                <div className="skeleton h-8 w-1/2" />
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-5">
                <div className="skeleton h-3 w-28 mb-4" />
                <div className="skeleton h-8 w-1/2" />
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-5">
                <div className="skeleton h-3 w-28 mb-4" />
                <div className="skeleton h-8 w-1/2" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all">
              <div className="card-body p-5">
                <p className="text-xs text-base-content/70 uppercase tracking-wider mb-2">Total DeFi Value</p>
                <p className="text-2xl font-bold text-base-content">{formatUSD(totalValue)}</p>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all">
              <div className="card-body p-5">
                <p className="text-xs text-base-content/70 uppercase tracking-wider mb-2">Unrealized PnL</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-success' : 'text-error'}`}>
                  {totalPnL >= 0 ? '+' : ''}{formatUSD(totalPnL)}
                </p>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all">
              <div className="card-body p-5">
                <p className="text-xs text-base-content/70 uppercase tracking-wider mb-2">Active Protocols</p>
                <p className="text-2xl font-bold text-base-content">{new Set(defiPositions.map(d => d.protocol)).size}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Positions by Type */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-6 w-36" />
          <div className="skeleton h-16 w-full rounded-lg" />
          <div className="skeleton h-16 w-full rounded-lg" />
          <div className="skeleton h-16 w-full rounded-lg" />
        </div>
      ) : Object.entries(byType).map(([type, positions]) => (
        <div key={type}>
          <h2 className="text-sm font-medium text-base-content/70 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            {type}
          </h2>
          <div className="space-y-2">
            {positions.map((pos, i) => (
              <div key={i} className="bg-base-200 border border-base-300 rounded-xl p-4 hover:border-primary/20 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-base-content">{pos.protocol}</h3>
                      <span className="text-xs text-base-content/70 bg-base-300 px-2 py-0.5 rounded-full">{pos.asset}</span>
                    </div>
                    <p className="text-xs text-base-content/70 mt-0.5">{pos.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-base-content">{formatUSD(pos.value)}</p>
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    {pos.apy && (
                      <span className="text-xs text-success flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {pos.apy}% APY
                      </span>
                    )}
                    {pos.pnl !== undefined && pos.pnl !== null && (
                      <span className={`text-xs flex items-center gap-1 ${pos.pnl >= 0 ? 'text-success' : 'text-error'}`}>
                        {pos.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {pos.pnl >= 0 ? '+' : ''}{formatUSD(pos.pnl)} PnL
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
