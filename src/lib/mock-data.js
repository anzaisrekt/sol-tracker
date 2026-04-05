// Realistic demo data for when no wallet is connected or QuickNode is not configured

export const MOCK_TOKENS = [
  {
    mint: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    name: "Solana",
    amount: 142.58,
    price: 178.42,
    change24h: 3.24,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    name: "USD Coin",
    amount: 8420.0,
    price: 1.0,
    change24h: 0.01,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether",
    amount: 3150.0,
    price: 1.0,
    change24h: -0.02,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  },
  {
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    amount: 5200.0,
    price: 1.12,
    change24h: 7.85,
    logo: "https://static.jup.ag/jup/icon.png",
  },
  {
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    amount: 45000000,
    price: 0.0000234,
    change24h: -2.15,
    logo: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
  },
  {
    mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    symbol: "mSOL",
    name: "Marinade SOL",
    amount: 28.45,
    price: 195.8,
    change24h: 3.45,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
  },
  {
    mint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    symbol: "RAY",
    name: "Raydium",
    amount: 890.0,
    price: 4.52,
    change24h: 1.23,
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  },
  {
    mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3",
    symbol: "PYTH",
    name: "Pyth Network",
    amount: 12500.0,
    price: 0.42,
    change24h: -1.89,
    logo: "https://pyth.network/token.svg",
  },
];

export const MOCK_NFTS = [
  {
    name: "Mad Lad #4521",
    collection: "Mad Lads",
    image: null,
    floorPrice: 128.5,
  },
  {
    name: "Tensorian #892",
    collection: "Tensorians",
    image: null,
    floorPrice: 42.3,
  },
  {
    name: "Claynosaurz #2341",
    collection: "Claynosaurz",
    image: null,
    floorPrice: 18.7,
  },
  {
    name: "Famous Fox #1103",
    collection: "Famous Fox Federation",
    image: null,
    floorPrice: 8.2,
  },
  {
    name: "Okay Bear #3892",
    collection: "Okay Bears",
    image: null,
    floorPrice: 22.1,
  },
  { name: "DeGod #5512", collection: "DeGods", image: null, floorPrice: 35.8 },
];

export const MOCK_DEFI = [
  {
    protocol: "Marinade Finance",
    type: "Liquid Staking",
    asset: "mSOL",
    amount: 28.45,
    value: 5570.41,
    apy: 7.2,
  },
  {
    protocol: "Raydium",
    type: "LP Position",
    asset: "SOL/USDC",
    amount: null,
    value: 4200.0,
    apy: 24.5,
  },
  {
    protocol: "Jupiter Perps",
    type: "Perpetuals",
    asset: "SOL-LONG",
    amount: null,
    value: 2800.0,
    apy: null,
    pnl: 340.0,
  },
  {
    protocol: "Kamino Finance",
    type: "Lending",
    asset: "USDC Supply",
    amount: 5000.0,
    value: 5000.0,
    apy: 8.4,
  },
  {
    protocol: "Drift Protocol",
    type: "Perp DEX",
    asset: "SOL-PERP",
    amount: null,
    value: 1500.0,
    apy: null,
    pnl: -120.0,
  },
  {
    protocol: "Jito",
    type: "Liquid Staking",
    asset: "jitoSOL",
    amount: 15.2,
    value: 2718.0,
    apy: 7.8,
  },
];

export const MOCK_TRANSACTIONS = [
  {
    signature: "5xGH...rT9v",
    blockTime: Math.floor(Date.now() / 1000) - 120,
    type: "Swap",
    description: "Swapped 2.5 SOL → 445 USDC",
    status: "success",
  },
  {
    signature: "3kLP...mN2w",
    blockTime: Math.floor(Date.now() / 1000) - 3600,
    type: "Transfer",
    description: "Sent 100 USDC to 7xKf...9pQr",
    status: "success",
  },
  {
    signature: "9aBC...xY4z",
    blockTime: Math.floor(Date.now() / 1000) - 7200,
    type: "Stake",
    description: "Staked 10 SOL via Marinade",
    status: "success",
  },
  {
    signature: "2dEF...hJ6k",
    blockTime: Math.floor(Date.now() / 1000) - 14400,
    type: "Swap",
    description: "Swapped 1000 USDC → 5.58 SOL",
    status: "success",
  },
  {
    signature: "8gHI...pQ3r",
    blockTime: Math.floor(Date.now() / 1000) - 28800,
    type: "NFT Buy",
    description: "Bought Mad Lad #4521 for 128.5 SOL",
    status: "success",
  },
  {
    signature: "4jKL...wX5y",
    blockTime: Math.floor(Date.now() / 1000) - 43200,
    type: "LP Deposit",
    description: "Added liquidity SOL/USDC on Raydium",
    status: "success",
  },
  {
    signature: "6mNO...zA7b",
    blockTime: Math.floor(Date.now() / 1000) - 86400,
    type: "Claim",
    description: "Claimed 250 JUP airdrop",
    status: "success",
  },
  {
    signature: "1pQR...cD8e",
    blockTime: Math.floor(Date.now() / 1000) - 172800,
    type: "Transfer",
    description: "Received 5 SOL from 3bVm...8wKr",
    status: "success",
  },
];

export const MOCK_PORTFOLIO_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const baseValue = 42000;
  const variance = Math.sin(i / 3) * 3000 + Math.random() * 2000 - 1000;
  return {
    date: date.toISOString().split("T")[0],
    timestamp: date.toISOString(),
    value: Math.max(35000, baseValue + variance + i * 150),
  };
});

export function getMockPortfolioTotal() {
  const tokenTotal = MOCK_TOKENS.reduce(
    (sum, t) => sum + t.amount * t.price,
    0,
  );
  const nftTotal = MOCK_NFTS.reduce((sum, n) => sum + n.floorPrice * 178.42, 0);
  const defiTotal = MOCK_DEFI.reduce((sum, d) => sum + d.value, 0);
  return {
    tokenTotal,
    nftTotal,
    defiTotal,
    total: tokenTotal + nftTotal + defiTotal,
  };
}
