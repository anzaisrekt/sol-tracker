import { useState, useEffect } from 'react'
import { usePortfolio } from '../lib/portfolio-context'
import { supabase } from '../lib/supabase'
import { Save, Trash2, Plus, Wallet, Globe } from 'lucide-react'
import { shortenAddress } from '../lib/solana'

export default function SettingsPage() {
  const { manualAddress, setManualWallet, activeAddress } = usePortfolio()
  const [addressInput, setAddressInput] = useState(manualAddress || '')
  const [savedWallets, setSavedWallets] = useState([])
  const [walletLabel, setWalletLabel] = useState('')
  const [refreshInterval, setRefreshInterval] = useState(
    () => localStorage.getItem('sol_refresh_interval') || '60'
  )

  useEffect(() => {
    loadSavedWallets()
  }, [])

  const loadSavedWallets = async () => {
    const { data } = await supabase.from('watched_wallets').select('*').order('created_at', { ascending: false })
    if (data) setSavedWallets(data)
  }

  const handleSaveWallet = async () => {
    if (!addressInput || addressInput.length < 32) return
    const { error } = await supabase.from('watched_wallets').upsert(
      { address: addressInput, label: walletLabel || 'Wallet' },
      { onConflict: 'address' }
    )
    if (!error) {
      loadSavedWallets()
      setWalletLabel('')
    }
  }

  const handleDeleteWallet = async (address) => {
    await supabase.from('watched_wallets').delete().eq('address', address)
    loadSavedWallets()
  }

  const handleTrackWallet = (address) => {
    setAddressInput(address)
    setManualWallet(address)
  }

  const handleRefreshChange = (val) => {
    setRefreshInterval(val)
    localStorage.setItem('sol_refresh_interval', val)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-base-content">Settings</h1>
        <p className="text-sm text-base-content/70 mt-1">Configure your portfolio tracker</p>
      </div>

      {/* Wallet Tracking */}
      <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-base-content flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          Wallet Tracking
        </h2>

        <div className="space-y-2">
          <label className="text-xs text-base-content/70">Track Wallet Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter Solana wallet address..."
              className="flex-1 px-3 py-2 text-sm bg-base-300 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-base-content placeholder:text-base-content/50 font-mono"
            />
            <button
              onClick={() => setManualWallet(addressInput)}
              className="px-4 py-2 text-sm bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
            >
              Track
            </button>
          </div>
        </div>

        {activeAddress && (
          <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
            <Globe className="w-4 h-4 text-success" />
            <span className="text-xs text-base-content">Currently tracking: <span className="font-mono">{shortenAddress(activeAddress, 8)}</span></span>
          </div>
        )}

        {/* Save wallet */}
        <div className="border-t border-base-300 pt-4 space-y-2">
          <label className="text-xs text-base-content/70">Save to Watchlist</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={walletLabel}
              onChange={(e) => setWalletLabel(e.target.value)}
              placeholder="Label (e.g., Main Wallet)"
              className="flex-1 px-3 py-2 text-sm bg-base-300 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-base-content placeholder:text-base-content/50"
            />
            <button
              onClick={handleSaveWallet}
              disabled={!addressInput}
              className="px-4 py-2 text-sm bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        {/* Saved wallets */}
        {savedWallets.length > 0 && (
          <div className="border-t border-base-300 pt-4 space-y-2">
            <label className="text-xs text-base-content/70">Saved Wallets</label>
            {savedWallets.map(wallet => (
              <div key={wallet.address} className="flex items-center justify-between px-3 py-2 bg-base-300 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-base-content/70" />
                  <div>
                    <p className="text-sm text-base-content">{wallet.label}</p>
                    <p className="text-xs text-base-content/70 font-mono">{shortenAddress(wallet.address, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTrackWallet(wallet.address)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Track
                  </button>
                  <button
                    onClick={() => handleDeleteWallet(wallet.address)}
                    className="p-1 text-base-content/70 hover:text-error transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="bg-base-200 border border-base-300 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-medium text-base-content">Preferences</h2>

        <div className="space-y-2">
          <label className="text-xs text-base-content/70">Auto-Refresh Interval</label>
          <select
            value={refreshInterval}
            onChange={(e) => handleRefreshChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-base-300 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-base-content"
          >
            <option value="30">Every 30 seconds</option>
            <option value="60">Every minute</option>
            <option value="300">Every 5 minutes</option>
            <option value="0">Manual only</option>
          </select>
        </div>
      </div>

      {/* About */}
      <div className="bg-base-200 border border-base-300 rounded-xl p-5">
        <h2 className="text-sm font-medium text-base-content mb-2">About</h2>
        <p className="text-xs text-base-content/70 leading-relaxed">
          SolTracker is a comprehensive Solana portfolio tracker powered by QuickNode RPC.
          It provides real-time token balances, NFT tracking, DeFi position monitoring,
          and historical portfolio analytics. Connect your wallet or enter any Solana
          address to get started.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">QuickNode RPC</span>
          <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full">Jupiter Pricing</span>
          <span className="text-xs px-2 py-0.5 bg-info/10 text-info rounded-full">DAS API</span>
        </div>
      </div>
    </div>
  )
}
