import { supabase } from "./supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const QUICKNODE_RPC_URL = import.meta.env.VITE_QUICKNODE_RPC_URL;
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY;
const TENSOR_API_URL = import.meta.env.VITE_TENSOR_API_URL;
const TENSOR_API_KEY = import.meta.env.VITE_TENSOR_API_KEY;
const MAGIC_EDEN_API = "https://api-mainnet.magiceden.dev/v2";
const DEXSCREENER_API = "https://api.dexscreener.com";
const HELIUS_RPC_URL = HELIUS_API_KEY
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : null;

export const TOKEN_METADATA = {
  So11111111111111111111111111111111111111112: {
    symbol: "wSOL",
    name: "Wrapped SOL",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    symbol: "USDC",
    name: "USD Coin",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
    symbol: "USDT",
    name: "Tether",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
  },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: {
    symbol: "JUP",
    name: "Jupiter",
    logo: "https://static.jup.ag/jup/icon.png",
  },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: {
    symbol: "BONK",
    name: "Bonk",
    logo: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I",
  },
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: {
    symbol: "mSOL",
    name: "Marinade SOL",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png",
  },
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": {
    symbol: "RAY",
    name: "Raydium",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png",
  },
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: {
    symbol: "PYTH",
    name: "Pyth Network",
    logo: "https://pyth.network/token.svg",
  },
};

export function getTokenMetadata(mint) {
  return TOKEN_METADATA[mint] || null;
}

const PRICE_FALLBACKS = {
  So11111111111111111111111111111111111111112: "solana",
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "usd-coin",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "tether",
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: "jupiter-exchange-solana",
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: "bonk",
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: "marinade-staked-sol",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": "raydium",
  HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3: "pyth-network",
};

function buildRpcEndpoints() {
  const endpoints = [];

  if (QUICKNODE_RPC_URL) {
    endpoints.push(QUICKNODE_RPC_URL);
  }

  if (SUPABASE_URL) {
    endpoints.push(`${SUPABASE_URL}/functions/v1/quicknode-proxy`);
  }

  return endpoints;
}

async function rpcCall(method, params = []) {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  };

  for (const endpoint of buildRpcEndpoints()) {
    try {
      const headers = { "Content-Type": "application/json" };

      if (endpoint.includes("/functions/v1/")) {
        headers.apikey = SUPABASE_ANON_KEY;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("RPC error:", data.error || response.statusText);
        continue;
      }

      return data.result;
    } catch (err) {
      console.error("RPC call failed:", err);
    }
  }

  return null;
}

async function heliusRpcCall(method, params = []) {
  if (!HELIUS_RPC_URL) return null;

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  };

  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || data.error) return null;
    return data.result;
  } catch (err) {
    console.error("Helius RPC error:", err);
    return null;
  }
}

function getDasItems(response) {
  if (!response) return [];
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.result?.items)) return response.result.items;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

async function fetchAllDasPages(callFn, method, basePayload, maxPages = 20) {
  const items = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = { ...basePayload, page };
    const result = await callFn(method, payload);
    let pageItems = getDasItems(result);

    if (pageItems.length === 0) {
      const wrappedResult = await callFn(method, [payload]);
      pageItems = getDasItems(wrappedResult);
    }

    if (!Array.isArray(pageItems) || pageItems.length === 0) {
      break;
    }

    items.push(...pageItems);

    if (pageItems.length < (basePayload.limit || 250)) {
      break;
    }
  }

  return items;
}

export async function getSOLBalance(address) {
  const result = await rpcCall("getBalance", [address]);
  if (result !== null && result !== undefined) {
    return (result.value ?? result) / 1e9;
  }
  return 0;
}

export async function getTokenAccounts(address) {
  const tokenPrograms = [
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  ];

  const accountLists = await Promise.all(
    tokenPrograms.map(async (programId) => {
      const result = await rpcCall("getTokenAccountsByOwner", [
        address,
        { programId },
        { encoding: "jsonParsed" },
      ]);

      if (!result?.value) return [];

      return result.value
        .map((account) => {
          const info = account.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmount,
            decimals: info.tokenAmount.decimals,
            address: account.pubkey,
            programId,
          };
        })
        .filter((token) => token.amount > 0);
    }),
  );

  const merged = new Map();

  for (const token of accountLists.flat()) {
    if (!token.mint) continue;
    const existing = merged.get(token.mint);
    if (!existing || token.amount > existing.amount) {
      merged.set(token.mint, token);
    }
  }

  return [...merged.values()];
}

function detectTransferDirectionFromHelius(txData, walletAddress) {
  if (!walletAddress || !txData) return null;

  const wallet = walletAddress.toLowerCase();
  const nativeTransfers = Array.isArray(txData.nativeTransfers)
    ? txData.nativeTransfers
    : [];
  const tokenTransfers = Array.isArray(txData.tokenTransfers)
    ? txData.tokenTransfers
    : [];

  let outgoing = false;
  let incoming = false;

  for (const transfer of [...nativeTransfers, ...tokenTransfers]) {
    const from = String(
      transfer?.fromUserAccount ||
        transfer?.from ||
        transfer?.authority ||
        transfer?.owner ||
        "",
    ).toLowerCase();
    const to = String(
      transfer?.toUserAccount || transfer?.to || transfer?.destination || "",
    ).toLowerCase();

    if (from && from === wallet) outgoing = true;
    if (to && to === wallet) incoming = true;
  }

  if (outgoing && !incoming) return "Send";
  if (incoming && !outgoing) return "Received";
  if (incoming || outgoing) return "Send";
  return null;
}

function detectTransferDirectionFromParsedInstructions(
  instructions,
  walletAddress,
) {
  if (!walletAddress || !Array.isArray(instructions)) return null;

  const wallet = walletAddress.toLowerCase();
  let outgoing = false;
  let incoming = false;

  for (const ix of instructions) {
    const info = ix?.parsed?.info;
    if (!info) continue;

    const from = String(
      info?.source || info?.from || info?.authority || info?.owner || "",
    ).toLowerCase();
    const to = String(
      info?.destination || info?.to || info?.newAccount || "",
    ).toLowerCase();

    if (from && from === wallet) outgoing = true;
    if (to && to === wallet) incoming = true;
  }

  if (outgoing && !incoming) return "Send";
  if (incoming && !outgoing) return "Received";
  if (incoming || outgoing) return "Send";
  return null;
}

function analyzeTransactionType(txData, walletAddress = "") {
  if (!txData) return "Transaction";

  const description = txData.description?.toLowerCase() || "";
  const type = txData.type?.toLowerCase() || "";
  const actions = txData.actions || [];

  // Check description for type keywords
  if (
    description.includes("swap") ||
    type.includes("swap") ||
    actions.some((a) => a.type === "SWAP")
  ) {
    return "Swap";
  }

  if (
    description.includes("transfer") ||
    type.includes("transfer") ||
    actions.some((a) => a.type === "TRANSFER")
  ) {
    return detectTransferDirectionFromHelius(txData, walletAddress) || "Send";
  }

  if (
    description.includes("stake") ||
    description.includes("delegate") ||
    type.includes("stake") ||
    actions.some((a) => a.type === "STAKE")
  ) {
    return "Stake";
  }

  if (
    description.includes("nft") ||
    description.includes("buy") ||
    type.includes("nft") ||
    actions.some((a) => a.type === "NFT_BUY")
  ) {
    return "NFT Buy";
  }

  if (
    description.includes("liquidity") ||
    description.includes("pool") ||
    type.includes("lp") ||
    actions.some((a) => a.type === "ADD_LIQUIDITY")
  ) {
    return "LP Deposit";
  }

  if (
    description.includes("claim") ||
    type.includes("claim") ||
    actions.some((a) => a.type === "CLAIM")
  ) {
    return "Claim";
  }

  return "Transaction";
}

export async function getRecentTransactionsWithTypes(address, limit = 50) {
  // Try Helius parsed transactions API first
  if (HELIUS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${address}/transactions?limit=${limit}&api-key=${HELIUS_API_KEY}`,
      );
      if (response.ok) {
        const txns = await response.json();
        if (Array.isArray(txns) && txns.length > 0) {
          return txns.map((tx) => {
            let blockTime = 0;
            if (tx.timestamp) {
              if (typeof tx.timestamp === "string") {
                blockTime = Math.floor(new Date(tx.timestamp).getTime() / 1000);
              } else if (typeof tx.timestamp === "number") {
                blockTime =
                  tx.timestamp > 1e10
                    ? Math.floor(tx.timestamp / 1000)
                    : tx.timestamp;
              }
            }
            return {
              signature: tx.signature,
              blockTime,
              type: analyzeTransactionType(tx, address),
              err: tx.status === "Success" ? null : true,
              confirmationStatus: "finalized",
              description:
                tx.description ||
                `${tx.signature.slice(0, 8)}...${tx.signature.slice(-8)}`,
            };
          });
        }
      }
    } catch (err) {
      console.error("Helius transactions error:", err);
    }
  }

  // Fallback: Get basic signatures and enhance with transaction details
  const signatures = await rpcCall("getSignaturesForAddress", [
    address,
    { limit },
  ]);

  if (!signatures) return [];

  // Fetch transaction details for first 30 transactions to get type info
  const txnDetailsPromises = signatures.slice(0, 30).map(async (sig) => {
    try {
      const tx = await rpcCall("getTransaction", [
        sig.signature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ]);

      if (tx?.transaction?.message?.instructions) {
        const instructions = tx.transaction.message.instructions || [];
        const accountKeys = tx.transaction.message.accountKeys || [];

        let detectedType = "Transaction";

        // Check instructions for type indicators
        for (const ix of instructions) {
          const programId = accountKeys[ix.programIdIndex]?.pubkey || "";
          const ixType = ix.parsed?.type || "";

          // Swap detection
          if (
            programId?.includes("JUP") ||
            programId?.includes("675kPX9MHTjS2zt1qLCVq") || // Raydium
            programId?.includes("whirLbMiicVdio4KfQ7QV") || // Orca
            ixType?.includes("swap")
          ) {
            detectedType = "Swap";
            break;
          }

          // Stake detection
          if (
            programId?.includes("Marinade") ||
            programId?.includes("ChugSo9w18HVUtJKTg7Wkc") || // Lido
            ixType?.includes("stake") ||
            ixType?.includes("delegate")
          ) {
            detectedType = "Stake";
            break;
          }

          // Transfer detection
          if (
            ((programId?.includes("TokenkegQfeZyiNwAJbNbG") ||
              programId?.includes("TokenzQdBNbLqP5VEhdkAS6") ||
              programId?.includes("11111111111111111111111111111111")) &&
              ixType === "transfer") ||
            ixType?.includes("transfer")
          ) {
            detectedType =
              detectTransferDirectionFromParsedInstructions(
                instructions,
                address,
              ) || "Send";
            break;
          }

          // LP/Liquidity detection
          if (
            programId?.includes("675kPX9MHTjS2zt1qLCVq") || // Raydium
            programId?.includes("whirLbMiicVdio4KfQ7QV") || // Orca
            ixType?.includes("addLiquidity") ||
            ixType?.includes("liquidity")
          ) {
            detectedType = "LP Deposit";
            break;
          }

          // Claim detection
          if (ixType?.includes("claim") || ixType?.includes("harvest")) {
            detectedType = "Claim";
            break;
          }
        }

        return {
          signature: sig.signature,
          blockTime: sig.blockTime,
          type: sig.err ? "Failed" : detectedType,
          err: sig.err ? true : null,
          confirmationStatus: sig.confirmationStatus,
          description:
            sig.memo ||
            `${sig.signature.slice(0, 8)}...${sig.signature.slice(-8)}`,
        };
      }
    } catch (err) {
      console.debug("Could not fetch transaction details for", sig.signature);
    }

    // Fallback if we can't get details
    return {
      signature: sig.signature,
      blockTime: sig.blockTime,
      type: sig.err ? "Failed" : "Transaction",
      err: sig.err ? true : null,
      confirmationStatus: sig.confirmationStatus,
      description:
        sig.memo || `${sig.signature.slice(0, 8)}...${sig.signature.slice(-8)}`,
    };
  });

  const detailedTxns = await Promise.all(txnDetailsPromises);

  // Map remaining signatures without details to basic transaction objects
  const remainingTxns = signatures.slice(30).map((sig) => ({
    signature: sig.signature,
    blockTime: sig.blockTime,
    type: sig.err ? "Failed" : "Transaction",
    err: sig.err ? true : null,
    confirmationStatus: sig.confirmationStatus,
    description:
      sig.memo || `${sig.signature.slice(0, 8)}...${sig.signature.slice(-8)}`,
  }));

  return [...detailedTxns, ...remainingTxns];
}

export async function fetchHeliusProtocolTransactions(address, limit = 200) {
  if (!HELIUS_API_KEY || !address || limit <= 0) return [];

  const results = [];
  let before = null;
  const pageSize = 100;

  while (results.length < limit) {
    const currentLimit = Math.min(pageSize, limit - results.length);
    const beforeParam = before ? `&before=${before}` : "";

    try {
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${address}/transactions?limit=${currentLimit}${beforeParam}&api-key=${HELIUS_API_KEY}`,
      );

      if (!response.ok) break;

      const page = await response.json();
      if (!Array.isArray(page) || page.length === 0) break;

      results.push(...page);
      before = page[page.length - 1]?.signature || null;

      if (!before || page.length < currentLimit) break;
    } catch (error) {
      console.error("Helius protocol transaction fetch error:", error);
      break;
    }
  }

  const deduped = new Map();
  for (const tx of results) {
    if (!tx?.signature) continue;
    if (!deduped.has(tx.signature)) {
      deduped.set(tx.signature, tx);
    }
  }

  return [...deduped.values()];
}

export async function getRecentTransactions(address, limit = 20) {
  const signatures = await rpcCall("getSignaturesForAddress", [
    address,
    { limit },
  ]);

  if (!signatures) return [];

  return signatures.map((sig) => ({
    signature: sig.signature,
    slot: sig.slot,
    blockTime: sig.blockTime,
    err: sig.err,
    memo: sig.memo,
    confirmationStatus: sig.confirmationStatus,
  }));
}

export async function getAccountInfo(address) {
  const result = await rpcCall("getAccountInfo", [
    address,
    { encoding: "jsonParsed" },
  ]);
  return result?.value || null;
}

export async function getMultipleAccounts(addresses) {
  const result = await rpcCall("getMultipleAccounts", [
    addresses,
    { encoding: "jsonParsed" },
  ]);
  return result?.value || [];
}

export async function getAssetsByOwner(address) {
  const basePayload = {
    ownerAddress: address,
    limit: 250,
    displayOptions: {
      showFungible: false,
      showNativeBalance: true,
      showCollectionMetadata: true,
    },
  };

  const rpcDirectItems = await fetchAllDasPages(
    rpcCall,
    "getAssetsByOwner",
    basePayload,
  );
  if (rpcDirectItems.length > 0) return { items: rpcDirectItems };

  const rpcSearchItems = await fetchAllDasPages(rpcCall, "searchAssets", {
    ownerAddress: address,
    limit: 250,
  });
  if (rpcSearchItems.length > 0) return { items: rpcSearchItems };

  // Helius DAS fallback when the configured RPC endpoint does not expose DAS methods.
  const heliusDirectItems = await fetchAllDasPages(
    heliusRpcCall,
    "getAssetsByOwner",
    basePayload,
  );
  if (heliusDirectItems.length > 0) return { items: heliusDirectItems };

  const heliusSearchItems = await fetchAllDasPages(
    heliusRpcCall,
    "searchAssets",
    {
      ownerAddress: address,
      limit: 250,
    },
  );
  if (heliusSearchItems.length > 0) return { items: heliusSearchItems };

  return null;
}

function toSolPrice(value) {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric > 1e6 ? numeric / 1e9 : numeric;
}

function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url;
}

function getDexTokenFromPair(pair, mint) {
  if (!pair || !mint) return null;

  if (pair.baseToken?.address === mint) return pair.baseToken;
  if (pair.quoteToken?.address === mint) return pair.quoteToken;
  return pair.baseToken || pair.quoteToken || null;
}

function scoreDexPairForMint(pair, mint) {
  const liquidity = Number(pair?.liquidity?.usd || 0);
  const volume = Number(
    pair?.volume?.h24 || pair?.volume?.h6 || pair?.volume?.h1 || 0,
  );
  const isBaseMatch = pair?.baseToken?.address === mint ? 1 : 0;
  const hasImage = pair?.info?.imageUrl && isBaseMatch ? 1 : 0;
  const hasPrice = pair?.priceUsd ? 1 : 0;
  return (
    liquidity * 2 +
    volume +
    isBaseMatch * 5000 +
    hasImage * 1000 +
    hasPrice * 500
  );
}

async function fetchDexPairsByAddresses(pairAddresses) {
  const uniquePairs = [...new Set((pairAddresses || []).filter(Boolean))];
  if (uniquePairs.length === 0) return {};

  const result = {};
  const chain = "solana";

  await Promise.all(
    uniquePairs.map(async (pairAddress) => {
      try {
        const response = await fetch(
          `${DEXSCREENER_API}/latest/dex/pairs/${chain}/${pairAddress}`,
        );
        if (!response.ok) return;

        const data = await response.json();
        const pair = Array.isArray(data?.pairs) ? data.pairs[0] : null;
        if (!pair?.pairAddress) return;

        result[pair.pairAddress] = pair;
      } catch (err) {
        console.error("DexScreener pair fetch error:", err);
      }
    }),
  );

  for (const pairAddress of uniquePairs) {
    if (result[pairAddress]) continue;
    try {
      const response = await fetch(
        `${DEXSCREENER_API}/latest/dex/pairs/${chain}/${pairAddress}`,
      );
      if (!response.ok) continue;
      const data = await response.json();
      const pair = Array.isArray(data?.pairs) ? data.pairs[0] : null;
      if (!pair?.pairAddress) continue;
      result[pair.pairAddress] = pair;
    } catch {
      // Ignore individual pair retry failures.
    }
  }

  return result;
}

export async function fetchDexscreenerTokenMetadata(tokenAddresses) {
  const uniqueAddresses = [...new Set((tokenAddresses || []).filter(Boolean))];
  if (uniqueAddresses.length === 0) return {};

  const result = {};
  const chunkSize = 30;

  for (let index = 0; index < uniqueAddresses.length; index += chunkSize) {
    const chunk = uniqueAddresses.slice(index, index + chunkSize);
    try {
      const response = await fetch(
        `${DEXSCREENER_API}/tokens/v1/solana/${chunk.join(",")}`,
      );
      if (!response.ok) continue;

      const data = await response.json();
      const pairs = Array.isArray(data) ? data : data?.pairs || [];
      const bestByMint = new Map();
      const bestPairByMint = new Map();

      for (const pair of pairs) {
        const baseMint = pair?.baseToken?.address;
        const quoteMint = pair?.quoteToken?.address;
        const candidateMints = [baseMint, quoteMint].filter((mint) =>
          chunk.includes(mint),
        );

        for (const mint of candidateMints) {
          const token = getDexTokenFromPair(pair, mint);
          if (!token) continue;
          const isBaseMatch = pair?.baseToken?.address === mint;

          const nextEntry = {
            mint,
            symbol: token.symbol || null,
            name: token.name || null,
            logo: isBaseMatch
              ? normalizeImageUrl(pair?.info?.imageUrl || null)
              : null,
            price: toSolPrice(pair?.priceUsd),
            pairAddress: pair?.pairAddress || null,
          };

          const existing = bestByMint.get(mint);
          if (
            !existing ||
            scoreDexPairForMint(pair, mint) >
              scoreDexPairForMint(existing.__pair, mint)
          ) {
            bestByMint.set(mint, { ...nextEntry, __pair: pair });
            if (pair?.pairAddress) {
              bestPairByMint.set(mint, pair.pairAddress);
            }
          }
        }
      }

      const pairDetailsByAddress = await fetchDexPairsByAddresses([
        ...bestPairByMint.values(),
      ]);

      for (const [mint, entry] of bestByMint.entries()) {
        const bestPairAddress = bestPairByMint.get(mint);
        const pair =
          (bestPairAddress ? pairDetailsByAddress[bestPairAddress] : null) ||
          entry.__pair ||
          null;
        const token = getDexTokenFromPair(pair, mint);
        const isBaseMatch = pair?.baseToken?.address === mint;
        result[mint] = {
          mint,
          symbol: token?.symbol || entry.symbol,
          name: token?.name || entry.name,
          logo: isBaseMatch
            ? normalizeImageUrl(pair?.info?.imageUrl || entry.logo || null)
            : entry.logo || null,
          price: toSolPrice(pair?.priceUsd) || entry.price,
          pairAddress: pair?.pairAddress || entry.pairAddress || null,
        };
      }
    } catch (err) {
      console.error("DexScreener token metadata error:", err);
    }
  }

  return result;
}

export async function fetchMagicEdenWalletTokens(walletAddress) {
  if (!walletAddress) return [];

  try {
    const allItems = [];
    const pageSize = 500;
    const maxPages = 10;

    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * pageSize;
      const response = await fetch(
        `${MAGIC_EDEN_API}/wallets/${walletAddress}/tokens?offset=${offset}&limit=${pageSize}`,
      );
      if (!response.ok) break;

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) break;

      allItems.push(...data);

      if (data.length < pageSize) break;
    }

    return allItems;
  } catch (err) {
    console.error("Magic Eden wallet tokens error:", err);
    return [];
  }
}

export async function fetchMagicEdenCollectionStats(symbols) {
  const uniqueSymbols = [...new Set((symbols || []).filter(Boolean))];
  if (uniqueSymbols.length === 0) return {};

  const chunkSize = 50;
  const statsEntries = [];

  for (let i = 0; i < uniqueSymbols.length; i += chunkSize) {
    const chunk = uniqueSymbols.slice(i, i + chunkSize);
    const chunkEntries = await Promise.all(
      chunk.map(async (symbol) => {
        try {
          const response = await fetch(
            `${MAGIC_EDEN_API}/collections/${symbol}/stats`,
          );
          if (!response.ok) return [symbol, null];

          const data = await response.json();
          const floorPrice = toSolPrice(data?.floorPrice ?? data?.floor_price);
          const collectionOffer = toSolPrice(
            data?.topOffer ?? data?.top_offer ?? data?.bestOffer,
          );
          const listedPrice = toSolPrice(
            data?.listedPrice ??
              data?.lowestAsk ??
              data?.lowest_ask ??
              data?.minListingPrice ??
              data?.min_listing_price,
          );

          return [
            symbol,
            {
              floorPrice,
              collectionOffer,
              listedPrice,
            },
          ];
        } catch (err) {
          return [symbol, null];
        }
      }),
    );

    statsEntries.push(...chunkEntries);
  }

  return Object.fromEntries(statsEntries.filter(([, value]) => Boolean(value)));
}

export async function fetchTensorCollectionStats(symbols) {
  const uniqueSymbols = [...new Set((symbols || []).filter(Boolean))];
  if (uniqueSymbols.length === 0 || !TENSOR_API_URL) return {};

  const headers = { Accept: "application/json" };
  if (TENSOR_API_KEY) {
    headers["x-tensor-api-key"] = TENSOR_API_KEY;
    headers.Authorization = `Bearer ${TENSOR_API_KEY}`;
  }

  const tryFetch = async (url) => {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };

  const parseStats = (data) => {
    if (!data) return null;
    const root = data?.stats || data?.collectionStats || data?.data || data;
    const floorPrice = toSolPrice(
      root?.floorPrice ?? root?.floor_price ?? root?.floor,
    );
    const collectionOffer = toSolPrice(
      root?.topOffer ?? root?.top_offer ?? root?.bestBid ?? root?.best_bid,
    );
    const listedPrice = toSolPrice(
      root?.listedPrice ?? root?.lowestAsk ?? root?.lowest_ask ?? root?.listing,
    );

    if (!floorPrice && !collectionOffer && !listedPrice) return null;
    return { floorPrice, collectionOffer, listedPrice };
  };

  const statsEntries = await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      const direct = await tryFetch(
        `${TENSOR_API_URL}/collections/${symbol}/stats`,
      );
      const alternate =
        direct ||
        (await tryFetch(
          `${TENSOR_API_URL}/collections/stats?slug=${encodeURIComponent(symbol)}`,
        ));
      return [symbol, parseStats(alternate)];
    }),
  );

  return Object.fromEntries(statsEntries.filter(([, value]) => Boolean(value)));
}

export async function fetchMagicEdenTokensByMints(mints) {
  const uniqueMints = [...new Set((mints || []).filter(Boolean))];
  if (uniqueMints.length === 0) return {};

  const entries = await Promise.all(
    uniqueMints.slice(0, 120).map(async (mint) => {
      try {
        const response = await fetch(`${MAGIC_EDEN_API}/tokens/${mint}`);
        if (!response.ok) return [mint, null];

        const data = await response.json();
        if (!data || Object.keys(data).length === 0) return [mint, null];

        return [
          mint,
          {
            mintAddress: data.mintAddress || mint,
            name: data.name || "Unknown NFT",
            image: data.image || data.properties?.files?.[0]?.uri || null,
            collection: data.collectionName || data.collection || "Unknown",
            collectionSymbol: data.collection || null,
            collectionImage: data.image || null,
            price: toSolPrice(
              data.price ?? data?.priceInfo?.solPrice?.rawAmount,
            ),
            tokenAddress: data.tokenAddress || null,
          },
        ];
      } catch (err) {
        return [mint, null];
      }
    }),
  );

  return Object.fromEntries(entries.filter(([, value]) => Boolean(value)));
}

export async function saveSnapshot(walletAddress, data) {
  const { error } = await supabase.from("portfolio_snapshots").insert({
    wallet_address: walletAddress,
    total_value_usd: data.totalValue || 0,
    sol_balance: data.solBalance || 0,
    token_count: data.tokenCount || 0,
    nft_count: data.nftCount || 0,
    snapshot_data: data,
  });

  if (error) console.error("Snapshot save error:", error);
}

export async function getPortfolioHistory(walletAddress, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .select("*")
    .eq("wallet_address", walletAddress)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("History fetch error:", error);
    return [];
  }

  return data || [];
}

export async function fetchTokenPrices(mintAddresses) {
  if (!mintAddresses.length) return {};

  try {
    const ids = mintAddresses.slice(0, 50).join(",");
    const response = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.data && Object.keys(data.data).length > 0) {
        return data.data;
      }
    }
  } catch (err) {
    console.error("Price fetch error:", err);
  }

  const fallbackIds = [
    ...new Set(
      mintAddresses.map((mint) => PRICE_FALLBACKS[mint]).filter(Boolean),
    ),
  ];
  if (fallbackIds.length === 0) return {};

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${fallbackIds.join(",")}&vs_currencies=usd&include_24hr_change=true`,
    );
    if (!response.ok) return {};

    const data = await response.json();
    const prices = {};

    Object.entries(PRICE_FALLBACKS).forEach(([mint, coinId]) => {
      const usd = data?.[coinId]?.usd;
      if (usd) {
        prices[mint] = {
          price: usd,
          change24h: data?.[coinId]?.usd_24h_change || 0,
          mintSymbol: coinId,
        };
      }
    });

    return prices;
  } catch (err) {
    console.error("Fallback price fetch error:", err);
  }

  const unresolvedMints = mintAddresses.filter(
    (mint) => !fallbackIds.includes(PRICE_FALLBACKS[mint]),
  );
  if (unresolvedMints.length === 0) return {};

  const resolvedPrices = {};

  await Promise.all(
    unresolvedMints.slice(0, 12).map(async (mint) => {
      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
        );
        if (!response.ok) return;

        const data = await response.json();
        const pair = data?.pairs?.find(
          (item) => item.chainId === "solana" && item.priceUsd,
        );
        if (!pair?.priceUsd) return;

        resolvedPrices[mint] = {
          price: Number(pair.priceUsd),
          change24h: pair?.priceChange?.h24 || 0,
          mintSymbol:
            pair.baseToken?.symbol || pair.baseToken?.name || mint.slice(0, 6),
        };
      } catch (error) {
        console.error("DexScreener price error:", error);
      }
    }),
  );

  return resolvedPrices;
}

export function formatUSD(value) {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value, decimals = 4) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(decimals);
}

export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
