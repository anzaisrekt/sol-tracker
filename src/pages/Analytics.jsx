import { useMemo } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { usePortfolio } from '../lib/portfolio-context'
import { formatUSD } from '../lib/solana'

const COLORS = ['#9945FF', '#14F195', '#00C2FF', '#f59e0b', '#ef4444', '#8b5cf6']
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export default function Analytics() {
  const {
    tokens = [],
    defiPositions = [],
    transactions = [],
    nfts = [],
    historicalChartData = [],
    dailyPnLPercentage,
    isLoading,
  } = usePortfolio()

  const startTime = Date.now() - THIRTY_DAYS_MS

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      const ts = (Number(tx.blockTime) || 0) * 1000
      return ts >= startTime
    })
  }, [transactions, startTime])

  const tokenDistribution = (tokens || [])
    .map((t) => ({ name: t.symbol, value: t.amount * t.price }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const txTypes = filteredTransactions.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1
    return acc
  }, {})
  const txTypeData = Object.entries(txTypes).map(([name, value]) => ({ name, value }))

  const protocolExposure = (defiPositions || []).map((d) => ({
    name: d.protocol,
    value: d.value,
  })) || []

  const spotValue = tokens.reduce((sum, t) => sum + t.amount * t.price, 0)
  const defiValue = defiPositions.reduce((sum, d) => sum + d.value, 0)

  const HistoryTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const point = payload[0].payload
      return (
        <div className="bg-base-300 border border-base-300 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-base-content/70 mb-1">{point.fullDate || point.date}</p>
          <p className="text-sm font-semibold text-base-content">{formatUSD(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  const MetricSkeleton = () => (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-4">
        <div className="skeleton h-3 w-20 mb-2" />
        <div className="skeleton h-7 w-1/2" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-base-content">Analytics</h1>
        <p className="text-sm text-base-content/60 mt-1">30-day historical valuation using GeckoTerminal daily OHLCV (current balance x historical close)</p>
      </div>

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
            <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all">
              <div className="card-body p-4">
                <p className="text-xs text-base-content/60">24h Change</p>
                <p className={`text-lg font-bold mt-1 ${dailyPnLPercentage >= 0 ? 'text-success' : 'text-error'}`}>
                  {dailyPnLPercentage >= 0 ? '+' : ''}
                  {dailyPnLPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all">
              <div className="card-body p-4">
                <p className="text-xs text-base-content/60">DeFi / Total Ratio</p>
                <p className="text-lg font-bold mt-1 text-base-content">
                  {spotValue + defiValue > 0 ? ((defiValue / (spotValue + defiValue)) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all">
              <div className="card-body p-4">
                <p className="text-xs text-base-content/60">Token Diversity</p>
                <p className="text-lg font-bold mt-1 text-base-content">{(tokens || []).length} tokens</p>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 hover:border-primary/20 transition-all">
              <div className="card-body p-4">
                <p className="text-xs text-base-content/60">Total NFTs</p>
                <p className="text-lg font-bold mt-1 text-base-content">{(nfts || []).length}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-base-200 border border-base-300 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-base-content/70">Portfolio Value (Last 30 Days)</h3>
        </div>

        <div className="h-72">
          {isLoading ? (
            <div className="skeleton w-full h-64 rounded-xl" />
          ) : (historicalChartData || []).length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  tickFormatter={(val) => {
                    const d = new Date(Number(val))
                    if (!Number.isFinite(d.getTime())) return ''
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatUSD(Number(v) || 0)}
                  width={70}
                />
                <Tooltip content={<HistoryTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#14F195" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-base-content/70">
              No chart data available
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-base-200 border border-base-300 rounded-xl p-5">
          <h3 className="text-sm font-medium text-base-content/70 mb-4">Token Distribution</h3>
          <div className="h-64 flex items-center">
            {(tokenDistribution || []).length === 0 ? (
              <div className="w-full flex items-center justify-center text-sm text-base-content/70">
                No token distribution data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tokenDistribution} cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} dataKey="value">
                    {(tokenDistribution || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {(tokenDistribution || []).map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-base-content/70">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-base-200 border border-base-300 rounded-xl p-5">
          <h3 className="text-sm font-medium text-base-content/70 mb-4">Transaction Types (30D)</h3>
          <div className="h-64">
            {(txTypeData || []).length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-base-content/70">
                No transaction data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={txTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2030" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#9945FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-base-200 border border-base-300 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-base-content/70 mb-4">Protocol Exposure</h3>
          <div className="space-y-3">
            {(protocolExposure || []).length === 0 ? (
              <p className="text-sm text-base-content/70">No DeFi positions</p>
            ) : (
              (protocolExposure || []).map((p, i) => {
                const maxVal = Math.max(...(protocolExposure || []).map((x) => x.value), 0)
                const pct = maxVal > 0 ? (p.value / maxVal) * 100 : 0
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-base-content">{p.name}</span>
                      <span className="text-base-content/70">{formatUSD(p.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-base-300 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}