import { formatUSD, formatNumber, shortenAddress } from '../lib/solana'

export default function TokenRow({ token, index }) {
  const value = token.amount * token.price
  const isPositive = token.change24h > 0

  return (
    <tr className="hover transition-colors">
      <td className="py-3 px-4 text-sm text-base-content/70">{index + 1}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {token.logo ? (
            <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" onError={(e) => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center text-xs font-bold text-primary">
              {token.symbol?.slice(0, 2)}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-base-content">{token.symbol}</div>
            <div className="text-xs text-base-content/70">{token.name}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-base-content text-right font-mono">
        {formatNumber(token.amount)}
      </td>
      <td className="py-3 px-4 text-sm text-base-content text-right font-mono">
        {token.price < 0.01 ? `$${token.price.toFixed(8)}` : formatUSD(token.price)}
      </td>
      <td className="py-3 px-4 text-sm text-right font-mono font-medium text-base-content">
        {formatUSD(value)}
      </td>
      <td className={`py-3 px-4 text-sm text-right font-mono ${isPositive ? 'text-success' : token.change24h < 0 ? 'text-error' : 'text-base-content/70'}`}>
        {isPositive ? '+' : ''}{token.change24h?.toFixed(2)}%
      </td>
    </tr>
  )
}
