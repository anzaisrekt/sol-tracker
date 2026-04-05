import { useState } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'
import { usePortfolio } from '../lib/portfolio-context'
import { formatUSD } from '../lib/solana'
import TokenRow from '../components/TokenRow'

export default function Assets() {
  const { tokens, isLoading } = usePortfolio()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('value')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = tokens
    .filter(t => {
      const q = search.toLowerCase()
      return t.symbol?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q) || t.mint?.includes(q)
    })
    .sort((a, b) => {
      let valA, valB
      switch (sortBy) {
        case 'value': valA = a.amount * a.price; valB = b.amount * b.price; break
        case 'price': valA = a.price; valB = b.price; break
        case 'balance': valA = a.amount; valB = b.amount; break
        case 'change': valA = a.change24h; valB = b.change24h; break
        default: valA = a.amount * a.price; valB = b.amount * b.price;
      }
      return sortDir === 'desc' ? valB - valA : valA - valB
    })

  const totalValue = tokens.reduce((sum, t) => sum + t.amount * t.price, 0)

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const SortHeader = ({ label, col, align = 'left' }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`py-2 px-4 text-xs text-base-content/70 font-medium cursor-pointer hover:text-base-content transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === col && <ArrowUpDown className="w-3 h-3 text-primary" />}
      </span>
    </th>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-base-content">Token Assets</h1>
          {isLoading ? (
            <div className="skeleton h-5 w-72 mt-2" />
          ) : (
            <p className="text-sm text-base-content/70 mt-1">Total: {formatUSD(totalValue)} across {tokens.length} tokens</p>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/70" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tokens by name, symbol, or address..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-base-200 border border-base-300 rounded-xl focus:outline-none focus:border-primary text-base-content placeholder:text-base-content/50"
        />
      </div>

      {/* Table */}
      <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-pin-rows w-full">
              <thead>
                <tr>
                  <th className="py-2 px-4 text-xs text-base-content/70 font-medium text-left">#</th>
                  <SortHeader label="Token" col="name" />
                  <SortHeader label="Balance" col="balance" align="right" />
                  <SortHeader label="Price" col="price" align="right" />
                  <SortHeader label="Value" col="value" align="right" />
                  <SortHeader label="24h Change" col="change" align="right" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((token, i) => (
                  <TokenRow key={token.mint} token={token} index={i} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-base-content/70">
                      {search ? 'No tokens match your search.' : 'No tokens found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
