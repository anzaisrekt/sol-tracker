import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "./supabase";
import {
  getSOLBalance,
  getTokenAccounts,
  getRecentTransactionsWithTypes,
  fetchHeliusProtocolTransactions,
  fetchTokenPrices,
  saveSnapshot,
  getAssetsByOwner,
  getTokenMetadata,
  fetchMagicEdenWalletTokens,
  fetchMagicEdenCollectionStats,
  fetchMagicEdenTokensByMints,
  fetchTensorCollectionStats,
  fetchDexscreenerTokenMetadata,
} from "./solana";
import {
  MOCK_TOKENS,
  MOCK_NFTS,
  MOCK_DEFI,
  MOCK_TRANSACTIONS,
  MOCK_PORTFOLIO_HISTORY,
  getMockPortfolioTotal,
} from "./mock-data";

const PortfolioContext = createContext(null);

const SOL_MINT = "So11111111111111111111111111111111111111112";
const NATIVE_SOL_ID = "native-sol";
const NFT_COLLECTION_FLOORS = {
  "Mad Lads": 128.5,
  Tensorians: 42.3,
  Claynosaurz: 18.7,
  "Famous Fox Federation": 8.2,
  "Okay Bears": 22.1,
  DeGods: 35.8,
};

const DEFI_MINTS = {
  mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So: {
    protocol: "Marinade Finance",
    type: "Liquid Staking",
    asset: "mSOL",
    apy: 7.2,
  },
};

const DEFI_SYMBOL_PATTERNS = [
  {
    pattern: /\bmSOL\b/i,
    protocol: "Marinade Finance",
    type: "Liquid Staking",
    asset: "mSOL",
    apy: 7.2,
  },
  {
    pattern: /\bjitoSOL\b/i,
    protocol: "Jito",
    type: "Liquid Staking",
    asset: "jitoSOL",
    apy: 7.8,
  },
  {
    pattern: /\bstSOL\b/i,
    protocol: "Lido",
    type: "Liquid Staking",
    asset: "stSOL",
    apy: 6.5,
  },
  {
    pattern: /\bbSOL\b/i,
    protocol: "BlazeStake",
    type: "Liquid Staking",
    asset: "bSOL",
    apy: 6.9,
  },
  {
    pattern: /\bjupSOL\b/i,
    protocol: "Jupiter",
    type: "Liquid Staking",
    asset: "jupSOL",
    apy: 7.1,
  },
  {
    pattern: /\bstJUP\b|\bxJUP\b|\bvJUP\b/i,
    protocol: "Jupiter",
    type: "Staking",
    asset: "JUP",
    apy: null,
  },
  {
    pattern: /\bJUP\b.*\bstaked\b|\bstaked\b.*\bJUP\b|\bJupiter\b.*\bstake\b/i,
    protocol: "Jupiter",
    type: "Staking",
    asset: "JUP",
    apy: null,
  },
  {
    pattern: /\bJLP\b/i,
    protocol: "Jupiter",
    type: "Liquidity",
    asset: "JLP",
    apy: null,
  },
];

const CHART_DAYS = 30;
const GECKO_NETWORK = "solana";

function buildDailyTimestamps(days = CHART_DAYS) {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = new Date();
  const end = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return Array.from({ length: days }, (_, idx) => {
    return end - (days - 1 - idx) * dayMs;
  });
}

function normalizeOhlcvRows(payload) {
  const rows =
    payload?.data?.attributes?.ohlcv_list ||
    payload?.data?.attributes?.ohlcvList ||
    payload?.attributes?.ohlcv_list ||
    payload?.ohlcv_list ||
    [];

  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      if (Array.isArray(row)) {
        const rawTs = Number(row[0]);
        const close = Number(row[4]);
        if (!Number.isFinite(rawTs) || !Number.isFinite(close)) return null;

        const ts = rawTs > 1e12 ? rawTs : rawTs * 1000;
        return { ts, close };
      }

      if (row && typeof row === "object") {
        const rawTs = Number(row.timestamp ?? row.time ?? row.ts);
        const close = Number(row.close ?? row.c ?? row.value);
        if (!Number.isFinite(rawTs) || !Number.isFinite(close)) return null;

        const ts = rawTs > 1e12 ? rawTs : rawTs * 1000;
        return { ts, close };
      }

      return null;
    })
    .filter(Boolean);
}

async function fetchGeckoPoolDailyCloses(poolAddress, days = CHART_DAYS) {
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${GECKO_NETWORK}/pools/${poolAddress}/ohlcv/day?aggregate=1&currency=usd&limit=${days}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const payload = await response.json();
    const rawData = normalizeOhlcvRows(payload);
    console.log("Gecko OHLCV Data:", rawData);
    return rawData;
  } catch {
    return [];
  }
}

async function fetchHistoricalData(tokensForHistory, livePortfolioTotal) {
  const dayTimestamps = buildDailyTimestamps(CHART_DAYS);
  const dayTotals = dayTimestamps.map(() => 0);

  const candidates = (tokensForHistory || [])
    .filter((token) => Number(token?.amount) > 0 && token?.pairAddress)
    .map((token) => ({
      mint: token.mint === NATIVE_SOL_ID ? SOL_MINT : token.mint,
      pairAddress: token.pairAddress,
      amount: Number(token.amount) || 0,
    }))
    .filter((token) => Boolean(token.mint) && Boolean(token.pairAddress));

  const tokenSeries = await Promise.all(
    candidates.slice(0, 20).map(async (token) => {
      const closes = await fetchGeckoPoolDailyCloses(
        token.pairAddress,
        CHART_DAYS,
      );
      return { ...token, closes };
    }),
  );

  for (const token of tokenSeries) {
    if (!Array.isArray(token.closes) || token.closes.length === 0) continue;

    const closeByDay = new Map();
    for (const point of token.closes) {
      const dayKey = Date.UTC(
        new Date(point.ts).getUTCFullYear(),
        new Date(point.ts).getUTCMonth(),
        new Date(point.ts).getUTCDate(),
      );
      closeByDay.set(dayKey, Number(point.close) || 0);
    }

    // Preserve real daily values; only fill genuine gaps by carrying forward the last known close.
    let lastKnownClose = null;
    for (let i = 0; i < dayTimestamps.length; i += 1) {
      const dayTs = dayTimestamps[i];
      if (closeByDay.has(dayTs)) {
        lastKnownClose = Number(closeByDay.get(dayTs)) || 0;
      }
      if (lastKnownClose !== null) {
        dayTotals[i] += token.amount * lastKnownClose;
      }
    }
  }

  const finalDayChartTotal = Number(dayTotals[dayTotals.length - 1]) || 0;
  const targetTotal = Number(livePortfolioTotal) || 0;
  const unpricedValueDelta = targetTotal - finalDayChartTotal;

  const shifted = dayTotals.map((value) => (Number(value) || 0) + unpricedValueDelta);

  let historical = shifted.map((value, idx) => {
    const ts = dayTimestamps[idx];
    return {
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      totalPortfolioValue: value,
      value,
    };
  });

  if (historical.length === 1) {
    const flatValue = Number(historical[0].value) || 0;
    const paddedDays = buildDailyTimestamps(CHART_DAYS).map((ts) => ({
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      totalPortfolioValue: flatValue,
      value: flatValue,
    }));
    historical = paddedDays;
  }

  return historical;
}

function getAssetItems(assetResponse) {
  return (
    assetResponse?.items ||
    assetResponse?.result?.items ||
    assetResponse?.data?.items ||
    assetResponse?.assets ||
    []
  );
}

function getAssetMint(asset) {
  return (
    asset?.id ||
    asset?.address ||
    asset?.mint ||
    asset?.token_info?.mint ||
    asset?.content?.metadata?.mint ||
    null
  );
}

function getAssetName(asset) {
  const candidates = [
    asset?.content?.metadata?.name,
    asset?.grouping?.find((g) => g?.group_key === "collection")
      ?.collection_metadata?.name,
    asset?.token_info?.symbol,
    asset?.symbol,
    asset?.name,
  ];
  return (
    candidates
      .find((value) => typeof value === "string" && value.trim().length > 0)
      ?.trim() || "Unknown NFT"
  );
}

function getAssetSymbol(asset) {
  return (
    asset?.content?.metadata?.symbol ||
    asset?.token_info?.symbol ||
    asset?.symbol ||
    ""
  );
}

function getAssetImage(asset) {
  const fileImage = asset?.content?.files?.find((file) =>
    file?.mime?.startsWith("image/"),
  );
  const raw =
    asset?.content?.links?.image ||
    fileImage?.uri ||
    fileImage?.cdn_uri ||
    asset?.content?.metadata?.image ||
    null;
  if (!raw) return null;
  if (raw.startsWith("ipfs://")) {
    return raw.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return raw;
}

function getAssetCollection(asset) {
  const collectionGroup = asset?.grouping?.find(
    (g) => g?.group_key === "collection",
  );
  return (
    collectionGroup?.collection_metadata?.name ||
    asset?.content?.metadata?.collection?.name ||
    collectionGroup?.group_value ||
    "Unknown"
  );
}

function getAssetCollectionImage(asset) {
  const collectionGroup = asset?.grouping?.find(
    (g) => g?.group_key === "collection",
  );
  const image = collectionGroup?.collection_metadata?.image || null;
  if (!image) return null;
  if (image.startsWith("ipfs://")) {
    return image.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return image;
}

function getAssetMetadataUri(asset) {
  const raw =
    asset?.content?.json_uri ||
    asset?.metadata_uri ||
    asset?.content?.metadata?.uri ||
    null;
  if (!raw) return null;
  if (raw.startsWith("ipfs://")) {
    return raw.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return raw;
}

function getAssetTokenStandard(asset) {
  return (
    asset?.token_info?.token_standard ||
    asset?.tokenStandard ||
    asset?.interface ||
    ""
  );
}

function normalizeNftAttributes(rawAttributes) {
  if (!Array.isArray(rawAttributes)) return [];

  return rawAttributes
    .map((attr) => {
      if (!attr) return null;
      const traitType =
        attr.trait_type || attr.traitType || attr.key || attr.name || null;
      const value = attr.value ?? attr.val ?? null;
      if (!traitType || value === null || value === undefined || value === "")
        return null;
      return {
        traitType: String(traitType),
        value: String(value),
      };
    })
    .filter(Boolean);
}

function normalizeRoyaltyPercent(raw) {
  if (raw === null || raw === undefined) return null;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return null;
  return numeric > 100 ? numeric / 100 : numeric;
}

function normalizeSolValue(value) {
  if (value === null || value === undefined) return 0;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric > 1e6 ? numeric / 1e9 : numeric;
}

function isCompressedAsset(asset) {
  const tokenStandard = `${getAssetTokenStandard(asset)}`.toLowerCase();
  const interfaceName = `${asset?.interface || ""}`.toLowerCase();
  return (
    asset?.compression?.compressed === true ||
    tokenStandard.includes("compressed") ||
    interfaceName.includes("compressed")
  );
}

function isRegularNftAsset(asset) {
  const tokenStandard = `${getAssetTokenStandard(asset)}`.toLowerCase();
  const interfaceName = `${asset?.interface || ""}`.toLowerCase();
  return (
    asset?.interface === "V1_NFT" ||
    asset?.interface === "ProgrammableNFT" ||
    interfaceName.includes("nft") ||
    tokenStandard.includes("nonfungible")
  );
}

function isNftLikeAsset(asset) {
  return isCompressedAsset(asset) || isRegularNftAsset(asset);
}

async function hydrateMissingNftFields(entries) {
  const unresolved = entries.filter(
    (entry) =>
      entry.metadataUri &&
      (!entry.image ||
        entry.name === "Unknown NFT" ||
        !entry.attributes?.length),
  );
  if (unresolved.length === 0) return entries;

  await Promise.all(
    unresolved.slice(0, 30).map(async (entry) => {
      try {
        const response = await fetch(entry.metadataUri);
        if (!response.ok) return;
        const data = await response.json();

        const imageRaw = data?.image || data?.properties?.files?.[0]?.uri;
        if (!entry.image && imageRaw) {
          entry.image = imageRaw.startsWith?.("ipfs://")
            ? imageRaw.replace("ipfs://", "https://ipfs.io/ipfs/")
            : imageRaw;
        }

        if (entry.name === "Unknown NFT" && data?.name) {
          entry.name = data.name;
        }

        if (
          (entry.collection === "Unknown" || !entry.collection) &&
          data?.collection?.name
        ) {
          entry.collection = data.collection.name;
        }

        if (
          (!entry.attributes || entry.attributes.length === 0) &&
          data?.attributes
        ) {
          entry.attributes = normalizeNftAttributes(data.attributes);
        }

        if (
          !entry.tokenStandard &&
          (data?.token_standard || data?.properties?.category)
        ) {
          entry.tokenStandard =
            data?.token_standard || data?.properties?.category || null;
        }

        if (
          entry.royaltyPercent === null ||
          entry.royaltyPercent === undefined
        ) {
          entry.royaltyPercent = normalizeRoyaltyPercent(
            data?.seller_fee_basis_points,
          );
        }
      } catch (err) {
        // Best-effort metadata hydration.
      }
    }),
  );

  return entries;
}

function mergeNftLists(primary, secondary) {
  const map = new Map();

  for (const item of [...primary, ...secondary]) {
    const key = item.mint || `${item.name || ""}:${item.collection || ""}`;
    if (!map.has(key)) {
      map.set(key, item);
      continue;
    }

    const existing = map.get(key);
    map.set(key, {
      ...existing,
      image: existing.image || item.image || null,
      collectionImage: existing.collectionImage || item.collectionImage || null,
      metadataUri: existing.metadataUri || item.metadataUri || null,
      collectionSymbol:
        existing.collectionSymbol || item.collectionSymbol || null,
      floorPrice: existing.floorPrice || item.floorPrice || 0,
      collectionOffer: existing.collectionOffer || item.collectionOffer || 0,
      price: existing.price || item.price || 0,
      isCompressed: existing.isCompressed || item.isCompressed || false,
      tokenStandard: existing.tokenStandard || item.tokenStandard || null,
      owner: existing.owner || item.owner || null,
      royaltyPercent: existing.royaltyPercent ?? item.royaltyPercent ?? null,
      attributes:
        existing.attributes && existing.attributes.length > 0
          ? existing.attributes
          : item.attributes || [],
    });
  }

  return [...map.values()];
}

function applyCollectionSymbolInference(items) {
  const symbolByCollection = new Map();

  for (const item of items) {
    if (item?.collection && item?.collectionSymbol) {
      symbolByCollection.set(item.collection, item.collectionSymbol);
    }
  }

  return items.map((item) => {
    if (item?.collectionSymbol || !item?.collection) return item;
    const inferred = symbolByCollection.get(item.collection);
    return inferred ? { ...item, collectionSymbol: inferred } : item;
  });
}

function shortMintLabel(mint) {
  if (!mint) return "Unknown Token";
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

function resolveTokenDisplayData(mint, tokenMeta, dexMeta, priceData, asset) {
  const symbol =
    dexMeta?.symbol ||
    tokenMeta?.symbol ||
    priceData?.mintSymbol ||
    getAssetSymbol(asset) ||
    shortMintLabel(mint);
  const name =
    dexMeta?.name || tokenMeta?.name || priceData?.mintSymbol || symbol;
  const logo = dexMeta?.logo || tokenMeta?.logo || null;
  const price = priceData?.price || dexMeta?.price || 0;

  return {
    symbol,
    name,
    logo,
    price,
  };
}

function pickPreferredMetric(primaryValue, secondaryValue, metric) {
  const first = Number(primaryValue) > 0 ? Number(primaryValue) : 0;
  const second = Number(secondaryValue) > 0 ? Number(secondaryValue) : 0;

  if (!first && !second) return 0;
  if (!first) return second;
  if (!second) return first;

  // For floor/listed price, lower usually reflects the most competitive live ask.
  if (metric === "floorPrice" || metric === "listedPrice") {
    return Math.min(first, second);
  }

  // For top offers, higher is the stronger bid.
  if (metric === "collectionOffer") {
    return Math.max(first, second);
  }

  return first;
}

function mergeCollectionStats(primaryStats, secondaryStats) {
  const symbols = [
    ...new Set([
      ...Object.keys(primaryStats || {}),
      ...Object.keys(secondaryStats || {}),
    ]),
  ];
  const merged = {};

  for (const symbol of symbols) {
    const primary = primaryStats?.[symbol] || {};
    const secondary = secondaryStats?.[symbol] || {};

    merged[symbol] = {
      floorPrice: pickPreferredMetric(
        primary.floorPrice,
        secondary.floorPrice,
        "floorPrice",
      ),
      collectionOffer: pickPreferredMetric(
        primary.collectionOffer,
        secondary.collectionOffer,
        "collectionOffer",
      ),
      listedPrice: pickPreferredMetric(
        primary.listedPrice,
        secondary.listedPrice,
        "listedPrice",
      ),
    };
  }

  return merged;
}

function getDeFiPositionForToken(token) {
  if (DEFI_MINTS[token.mint]) {
    return { ...DEFI_MINTS[token.mint] };
  }

  const tokenText = `${token.symbol || ""} ${token.name || ""}`;
  const match = DEFI_SYMBOL_PATTERNS.find((entry) =>
    entry.pattern.test(tokenText),
  );
  if (!match) return null;

  return {
    protocol: match.protocol,
    type: match.type,
    asset: match.asset,
    apy: match.apy,
  };
}

function parseAmountAndSymbol(text) {
  if (!text) return { amount: 0, symbol: null };
  const match = text.match(
    /(\d[\d,]*\.?\d*)\s*(jupsol|jitosol|msol|stsol|bsol|jlp|jup|sol|usdc|usdt|ray|pyth|bonk)/i,
  );
  if (!match) return { amount: 0, symbol: null };

  const amount = Number((match[1] || "0").replace(/,/g, "")) || 0;
  return { amount, symbol: (match[2] || "").toUpperCase() };
}

function inferProtocolFromDescription(description = "") {
  const lower = description.toLowerCase();
  if (lower.includes("jupiter") || lower.includes("jup")) return "Jupiter";
  if (lower.includes("marinade")) return "Marinade Finance";
  if (lower.includes("jito")) return "Jito";
  if (lower.includes("lido")) return "Lido";
  if (lower.includes("raydium")) return "Raydium";
  if (lower.includes("kamino")) return "Kamino Finance";
  return "Unknown Protocol";
}

function buildSymbolPriceMap(tokens) {
  return tokens.reduce((map, token) => {
    if (token?.symbol) {
      map[token.symbol.toUpperCase()] = Number(token.price) || 0;
    }
    return map;
  }, {});
}

function buildTxDerivedDeFiPositions(transactions, tokens) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const symbolPrices = buildSymbolPriceMap(tokens);
  const positions = [];

  for (const tx of transactions) {
    const description = tx?.description || "";
    const lower = description.toLowerCase();
    const isStake =
      tx?.type === "Stake" ||
      lower.includes("stake") ||
      lower.includes("delegat");
    const isLiquidity =
      tx?.type === "LP Deposit" ||
      lower.includes("liquidity") ||
      lower.includes("pool") ||
      /\bjlp\b/i.test(description);
    const isClaim =
      tx?.type === "Claim" ||
      lower.includes("claim") ||
      lower.includes("reward");

    if (!isStake && !isLiquidity && !isClaim) continue;

    const { amount, symbol } = parseAmountAndSymbol(description);
    const protocol = inferProtocolFromDescription(description);
    const type = isLiquidity ? "Liquidity" : isClaim ? "Rewards" : "Staking";
    const asset =
      isLiquidity && /sol\/?usdc|usdc\/?sol/i.test(description)
        ? "SOL/USDC"
        : symbol || (isClaim ? "Rewards" : "Unknown");

    const price = symbol ? symbolPrices[symbol] || 0 : 0;
    const value = amount > 0 ? amount * price : 0;

    positions.push({
      protocol,
      type,
      asset,
      apy: null,
      amount: amount || null,
      value,
      pnl: null,
    });
  }

  return positions;
}

function mergeDeFiPositions(primary = [], secondary = []) {
  const merged = new Map();

  for (const item of [...primary, ...secondary]) {
    const key = `${item.protocol}|${item.type}|${item.asset}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, item);
      continue;
    }

    merged.set(key, {
      ...existing,
      amount: existing.amount ?? item.amount,
      value: Math.max(Number(existing.value) || 0, Number(item.value) || 0),
      apy: existing.apy ?? item.apy,
      pnl: existing.pnl ?? item.pnl,
    });
  }

  return [...merged.values()].filter(
    (item) => (Number(item.value) || 0) > 0 || item.type === "Staking",
  );
}

function normalizeProtocolTx(tx) {
  const timestamp = tx?.timestamp;
  let blockTime = 0;

  if (typeof timestamp === "string") {
    blockTime = Math.floor(new Date(timestamp).getTime() / 1000);
  } else if (typeof timestamp === "number") {
    blockTime = timestamp > 1e10 ? Math.floor(timestamp / 1000) : timestamp;
  }

  return {
    signature: tx?.signature || "",
    blockTime,
    type: tx?.type || "Transaction",
    description: tx?.description || "",
    status: tx?.status === "Success" ? "success" : "failed",
    confirmationStatus: "finalized",
  };
}

function buildProtocolAdapterPositions(transactions, tokens) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const positions = [];
  const symbolPrices = buildSymbolPriceMap(tokens);

  const jupiterStakeTx = transactions.filter((tx) => {
    const text = (tx?.description || "").toLowerCase();
    return (
      text.includes("jupiter") &&
      (text.includes("stake") ||
        text.includes("staked") ||
        text.includes("vote"))
    );
  });

  const jupiterStakeTokens = tokens.filter((token) => {
    const symbol = (token?.symbol || "").toUpperCase();
    const name = (token?.name || "").toLowerCase();
    return (
      symbol === "JUP" ||
      symbol === "STJUP" ||
      symbol === "XJUP" ||
      symbol === "VJUP" ||
      name.includes("jupiter stake")
    );
  });

  if (jupiterStakeTx.length > 0 || jupiterStakeTokens.length > 0) {
    const jupValue = jupiterStakeTokens.reduce((sum, token) => {
      const price =
        Number(token.price) ||
        symbolPrices[(token.symbol || "").toUpperCase()] ||
        0;
      return sum + (Number(token.amount) || 0) * price;
    }, 0);

    positions.push({
      protocol: "Jupiter",
      type: "Staking",
      asset: "JUP",
      apy: null,
      amount:
        jupiterStakeTokens.reduce(
          (sum, token) => sum + (Number(token.amount) || 0),
          0,
        ) || null,
      value: jupValue,
      pnl: null,
    });
  }

  const kaminoTx = transactions.filter((tx) => {
    const text = (tx?.description || "").toLowerCase();
    return (
      text.includes("kamino") &&
      (text.includes("supply") ||
        text.includes("deposit") ||
        text.includes("lend") ||
        text.includes("borrow") ||
        text.includes("vault"))
    );
  });

  const kaminoTokenCandidates = tokens.filter((token) => {
    const symbol = (token?.symbol || "").toUpperCase();
    const name = (token?.name || "").toLowerCase();
    return (
      name.includes("kamino") || symbol.startsWith("K") || symbol === "KMNO"
    );
  });

  if (kaminoTx.length > 0 || kaminoTokenCandidates.length > 0) {
    const groupedByAsset = new Map();

    for (const tx of kaminoTx) {
      const { amount, symbol } = parseAmountAndSymbol(tx.description || "");
      const asset = symbol || "Vault Position";
      const price = symbol ? symbolPrices[symbol] || 0 : 0;
      const value = amount > 0 ? amount * price : 0;

      const prev = groupedByAsset.get(asset) || { amount: 0, value: 0 };
      groupedByAsset.set(asset, {
        amount: prev.amount + (amount || 0),
        value: Math.max(prev.value, value),
      });
    }

    if (groupedByAsset.size === 0 && kaminoTokenCandidates.length > 0) {
      const value = kaminoTokenCandidates.reduce((sum, token) => {
        const price =
          Number(token.price) ||
          symbolPrices[(token.symbol || "").toUpperCase()] ||
          0;
        return sum + (Number(token.amount) || 0) * price;
      }, 0);

      positions.push({
        protocol: "Kamino Finance",
        type: "Lending",
        asset: "Vault Position",
        apy: null,
        amount: null,
        value,
        pnl: null,
      });
    } else {
      for (const [asset, stats] of groupedByAsset.entries()) {
        positions.push({
          protocol: "Kamino Finance",
          type: "Lending",
          asset,
          apy: null,
          amount: stats.amount || null,
          value: stats.value || 0,
          pnl: null,
        });
      }
    }
  }

  return positions;
}

export function PortfolioProvider({ children }) {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualAddress, setManualAddress] = useState(
    () => localStorage.getItem("sol_manual_address") || "",
  );

  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [cnfts, setCnfts] = useState([]);
  const [defiPositions, setDefiPositions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [historicalChartData, setHistoricalChartData] = useState([]);
  const [dailyPnLPercentage, setDailyPnLPercentage] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isDemo, setIsDemo] = useState(true);

  const connectedAddress = connected ? publicKey?.toBase58() : "";
  const activeAddress = manualAddress || connectedAddress;

  // Load demo data on mount
  useEffect(() => {
    if (!activeAddress) {
      setIsDemo(true);
      setTokens(MOCK_TOKENS);
      setNfts(MOCK_NFTS);
      setCnfts([]);
      setDefiPositions(MOCK_DEFI);
      setTransactions(MOCK_TRANSACTIONS);
      setPortfolioHistory(MOCK_PORTFOLIO_HISTORY);
      setHistoricalChartData(
        (MOCK_PORTFOLIO_HISTORY || []).map((point) => ({
          ...point,
          totalPortfolioValue: Number(point.value) || 0,
          value: Number(point.value) || 0,
        })),
      );
      setDailyPnLPercentage(0);
      const totals = getMockPortfolioTotal();
      setTotalValue(totals.total);
      setSolBalance(142.58);
    }
  }, [activeAddress]);

  const setManualWallet = useCallback((address) => {
    setManualAddress(address);
    if (address) {
      localStorage.setItem("sol_manual_address", address);
    } else {
      localStorage.removeItem("sol_manual_address");
    }
  }, []);

  const refreshPortfolio = useCallback(
    async (targetAddress = activeAddress) => {
      if (!targetAddress) return;

      setLoading(true);
      setError(null);
      setIsDemo(false);
      setTokens([]);
      setNfts([]);
      setCnfts([]);
      setDefiPositions([]);
      setTransactions([]);
      setPortfolioHistory([]);
      setHistoricalChartData([]);
      setDailyPnLPercentage(0);
      setTotalValue(0);

      try {
        let sol = 0;
        try {
          sol = await getSOLBalance(targetAddress);
        } catch (walletError) {
          console.error("SOL balance error:", walletError);
        }
        setSolBalance(sol);

        let tokenAccounts = [];
        try {
          tokenAccounts = await getTokenAccounts(targetAddress);
        } catch (tokenError) {
          console.error("Token account error:", tokenError);
        }

        const mints = [SOL_MINT, ...tokenAccounts.map((t) => t.mint)];
        const dexMints = mints.filter((mint) => mint !== SOL_MINT);
        let prices = {};
        let dexTokenMetadata = {};
        try {
          const [priceResult, metadataResult] = await Promise.all([
            fetchTokenPrices(mints),
            fetchDexscreenerTokenMetadata(dexMints),
          ]);
          prices = priceResult;
          dexTokenMetadata = metadataResult;
        } catch (priceError) {
          console.error("Token enrichment error:", priceError);
        }

        const solPrice = prices[SOL_MINT]?.price || 0;
        const solChange24h = prices[SOL_MINT]?.change24h || 0;
        const tokenList = [
          {
            mint: NATIVE_SOL_ID,
            symbol: "SOL",
            name: "Solana",
            amount: sol,
            decimals: 9,
            price: prices[SOL_MINT]?.price || solPrice,
            change24h: solChange24h,
            pairAddress: null,
            logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
          },
          ...tokenAccounts.map((t) => {
            const priceData = prices[t.mint];
            const metadata = getTokenMetadata(t.mint);
            const dexMeta = dexTokenMetadata[t.mint];
            const display = resolveTokenDisplayData(
              t.mint,
              metadata,
              dexMeta,
              priceData,
              null,
            );
            return {
              mint: t.mint,
              symbol: display.symbol,
              name: display.name,
              amount: t.amount,
              decimals: t.decimals,
              price: display.price,
              change24h: priceData?.change24h || 0,
              pairAddress: dexMeta?.pairAddress || null,
              logo: dexMeta?.logo || display.logo,
            };
          }),
        ].filter((t) => t.amount > 0);

        let nftItems = [];
        let cnftItems = [];
        let liveTokenList = [];
        let liveDefiPositions = [];
        let hasDasData = false;

        const candidateNftMints = tokenAccounts
          .filter(
            (token) =>
              token.mint !== SOL_MINT &&
              token.decimals === 0 &&
              token.amount === 1,
          )
          .map((token) => token.mint);
        const magicEdenByMint =
          await fetchMagicEdenTokensByMints(candidateNftMints);

        const magicEdenWalletNfts =
          await fetchMagicEdenWalletTokens(targetAddress);
        const mappedMagicNfts = magicEdenWalletNfts.map((item) => {
          const mint =
            item?.mintAddress ||
            item?.tokenMint ||
            item?.mint ||
            item?.id ||
            null;
          const collection =
            item?.collectionName ||
            item?.collection ||
            item?.collectionSymbol ||
            "Unknown";
          const image =
            item?.image ||
            item?.img ||
            item?.imageUrl ||
            item?.metadata?.image ||
            null;
          const isCompressed = Boolean(item?.isCompressed || item?.compressed);

          return {
            mint,
            name: item?.name || item?.title || "Unknown NFT",
            collection,
            image,
            collectionImage: item?.collectionImage || image || null,
            floorPrice: normalizeSolValue(
              item?.collectionFloor || item?.floorPrice || item?.floor_price,
            ),
            collectionOffer: normalizeSolValue(
              item?.collectionOffer || item?.topOffer || item?.top_offer,
            ),
            price: normalizeSolValue(
              item?.price || item?.listedPrice || item?.lastSalePrice,
            ),
            metadataUri: item?.metadataUri || item?.json_uri || null,
            collectionSymbol: item?.collectionSymbol || item?.symbol || null,
            isCompressed,
            tokenStandard: item?.tokenStandard || item?.token_standard || null,
            owner: item?.owner || null,
            royaltyPercent: normalizeRoyaltyPercent(
              item?.sellerFeeBasisPoints || item?.royaltyBps,
            ),
            attributes: normalizeNftAttributes(
              item?.attributes || item?.metadata?.attributes,
            ),
          };
        });

        try {
          const dasResult = await getAssetsByOwner(targetAddress);
          const assetItems = getAssetItems(dasResult);
          hasDasData = Array.isArray(assetItems);
          const assetLookup = new Map(
            assetItems
              .map((asset) => [getAssetMint(asset), asset])
              .filter(([mint]) => Boolean(mint)),
          );
          const nftMints = new Set();

          for (const asset of assetItems) {
            const mint = getAssetMint(asset);
            if (!mint || !isNftLikeAsset(asset)) continue;

            nftMints.add(mint);
            const nftEntry = {
              name: getAssetName(asset),
              collection: getAssetCollection(asset),
              image: getAssetImage(asset),
              collectionImage:
                getAssetCollectionImage(asset) || getAssetImage(asset),
              floorPrice: NFT_COLLECTION_FLOORS[getAssetCollection(asset)] || 0,
              collectionOffer: 0,
              price: 0,
              metadataUri: getAssetMetadataUri(asset),
              collectionSymbol:
                asset?.grouping?.find((g) => g?.group_key === "collection")
                  ?.group_value || null,
              mint,
              isCompressed: isCompressedAsset(asset),
              isVerified:
                Array.isArray(asset?.creators) &&
                asset.creators.some((creator) => creator?.verified),
              tokenStandard: getAssetTokenStandard(asset) || null,
              owner: asset?.ownership?.owner || null,
              royaltyPercent: normalizeRoyaltyPercent(
                asset?.royalty?.basis_points ?? asset?.royalty?.percent,
              ),
              attributes: normalizeNftAttributes(
                asset?.content?.metadata?.attributes,
              ),
            };

            if (isCompressedAsset(asset)) {
              cnftItems.push(nftEntry);
            } else {
              nftItems.push(nftEntry);
            }
          }

          await hydrateMissingNftFields(nftItems);
          await hydrateMissingNftFields(cnftItems);

          for (const token of tokenList) {
            const priceData = prices[token.mint];
            const asset = assetLookup.get(token.mint);
            const dexMeta = dexTokenMetadata[token.mint];
            const metadata = getTokenMetadata(token.mint);

            if (token.mint === NATIVE_SOL_ID) {
              liveTokenList.push({
                ...token,
                symbol: "SOL",
                name: "Solana",
                price: token.price || prices[SOL_MINT]?.price || 0,
                logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
              });
              continue;
            }

            if (
              token.mint !== SOL_MINT &&
              (nftMints.has(token.mint) || isNftLikeAsset(asset))
            ) {
              continue;
            }

            const display = resolveTokenDisplayData(
              token.mint,
              metadata,
              dexMeta,
              priceData,
              asset,
            );

            liveTokenList.push({
              mint: token.mint,
              symbol: display.symbol,
              name: display.name,
              amount: token.amount,
              decimals: token.decimals,
              price: display.price,
              change24h: priceData?.change24h || 0,
              logo: dexMeta?.logo || display.logo,
              pairAddress: dexMeta?.pairAddress || null,
            });

            const defiPosition = getDeFiPositionForToken(token);
            if (defiPosition) {
              liveDefiPositions.push({
                ...defiPosition,
                amount: token.amount,
                value: token.amount * (priceData?.price || token.price || 0),
                pnl: 0,
              });
            }
          }

          setTokens(liveTokenList);
          setNfts(nftItems.map(({ metadataUri, ...rest }) => rest));
          setCnfts(cnftItems.map(({ metadataUri, ...rest }) => rest));

          setDefiPositions(liveDefiPositions);
        } catch (nftError) {
          console.error("NFT fetch error:", nftError);
          hasDasData = false;
          nftItems = [];
          cnftItems = [];
          liveTokenList = [];
          liveDefiPositions = [];
        }

        if (liveTokenList.length === 0) {
          liveTokenList = tokenList;
        }

        const fallbackNftItems = tokenAccounts
          .filter(
            (token) =>
              token.mint !== SOL_MINT &&
              token.decimals === 0 &&
              token.amount === 1,
          )
          .map((token) => {
            const meta = magicEdenByMint[token.mint];
            return {
              mint: token.mint,
              name: meta?.name || `NFT ${token.mint.slice(0, 6)}`,
              collection: meta?.collection || "Unverified",
              image: meta?.image || null,
              collectionImage: meta?.collectionImage || meta?.image || null,
              floorPrice: 0,
              collectionOffer: 0,
              price: meta?.price || 0,
              collectionSymbol: meta?.collectionSymbol || null,
              isCompressed: false,
              tokenStandard: meta?.tokenStandard || null,
              owner: null,
              royaltyPercent: null,
              attributes: normalizeNftAttributes(meta?.attributes),
            };
          });

        if (!hasDasData && fallbackNftItems.length > 0) {
          const existingNftMints = new Set(
            [...nftItems, ...cnftItems]
              .map((item) => item.mint)
              .filter(Boolean),
          );
          const filteredFallback = fallbackNftItems.filter(
            (item) => !existingNftMints.has(item.mint),
          );
          nftItems = [...nftItems, ...filteredFallback];
        }

        let mergedRegular = mergeNftLists(
          nftItems,
          mappedMagicNfts.filter((item) => !item.isCompressed),
        );
        let mergedCompressed = mergeNftLists(
          cnftItems,
          mappedMagicNfts.filter((item) => item.isCompressed),
        );

        const unresolvedMints = [
          ...new Set(
            [...mergedRegular, ...mergedCompressed]
              .filter(
                (item) =>
                  item?.mint && (!item.collectionSymbol || !item.floorPrice),
              )
              .map((item) => item.mint),
          ),
        ];

        if (unresolvedMints.length > 0) {
          const extraByMint =
            await fetchMagicEdenTokensByMints(unresolvedMints);
          const mappedExtra = Object.values(extraByMint)
            .filter(Boolean)
            .map((item) => ({
              mint: item?.mintAddress || item?.mint || null,
              name: item?.name || "Unknown NFT",
              collection: item?.collection || "Unknown",
              image: item?.image || null,
              collectionImage: item?.collectionImage || item?.image || null,
              floorPrice: normalizeSolValue(
                item?.collectionFloor || item?.floorPrice || item?.floor_price,
              ),
              collectionOffer: normalizeSolValue(
                item?.collectionOffer || item?.topOffer || item?.top_offer,
              ),
              price: normalizeSolValue(
                item?.price || item?.listedPrice || item?.lastSalePrice,
              ),
              metadataUri: item?.metadataUri || item?.json_uri || null,
              collectionSymbol:
                item?.collectionSymbol ||
                item?.symbol ||
                item?.collection ||
                null,
              isCompressed: Boolean(item?.isCompressed || item?.compressed),
              tokenStandard:
                item?.tokenStandard || item?.token_standard || null,
              owner: item?.owner || null,
              royaltyPercent: normalizeRoyaltyPercent(
                item?.sellerFeeBasisPoints || item?.royaltyBps,
              ),
              attributes: normalizeNftAttributes(
                item?.attributes || item?.metadata?.attributes,
              ),
            }));

          mergedRegular = mergeNftLists(
            mergedRegular,
            mappedExtra.filter((item) => !item.isCompressed),
          );
          mergedCompressed = mergeNftLists(
            mergedCompressed,
            mappedExtra.filter((item) => item.isCompressed),
          );
        }

        mergedRegular = applyCollectionSymbolInference(mergedRegular);
        mergedCompressed = applyCollectionSymbolInference(mergedCompressed);

        const collectionSymbols = [
          ...new Set(
            [...mergedRegular, ...mergedCompressed]
              .map((item) => item.collectionSymbol)
              .filter(Boolean),
          ),
        ];
        const [magicEdenStats, tensorStats] = await Promise.all([
          fetchMagicEdenCollectionStats(collectionSymbols),
          fetchTensorCollectionStats(collectionSymbols),
        ]);
        const collectionStats = mergeCollectionStats(
          magicEdenStats,
          tensorStats,
        );

        const withCollectionStats = (items) =>
          items.map((item) => {
            const stats = item.collectionSymbol
              ? collectionStats[item.collectionSymbol]
              : null;
            return {
              ...item,
              floorPrice: item.floorPrice || stats?.floorPrice || 0,
              collectionOffer:
                item.collectionOffer || stats?.collectionOffer || 0,
              price: item.price || stats?.listedPrice || 0,
            };
          });

        nftItems = withCollectionStats(mergedRegular);
        cnftItems = withCollectionStats(mergedCompressed);

        setTokens(liveTokenList);
        setNfts(nftItems);
        setCnfts(cnftItems);

        try {
          const [txns, protocolActivity] = await Promise.all([
            getRecentTransactionsWithTypes(targetAddress),
            fetchHeliusProtocolTransactions(targetAddress, 200),
          ]);

          if (txns.length > 0) {
            const formattedTxns = txns.map((tx) => ({
              signature: tx.signature,
              blockTime: tx.blockTime,
              type: tx.type === "Transfer" ? "Send" : tx.type,
              description:
                tx.description ||
                `${tx.signature.slice(0, 8)}...${tx.signature.slice(-8)}`,
              status: tx.type === "Failed" ? "failed" : "success",
              confirmationStatus: tx.confirmationStatus,
            }));
            setTransactions(formattedTxns);

            const txDerivedPositions = buildTxDerivedDeFiPositions(
              formattedTxns,
              liveTokenList,
            );
            const deepProtocolTx = Array.isArray(protocolActivity)
              ? protocolActivity.map(normalizeProtocolTx)
              : [];
            const protocolAdapterPositions = buildProtocolAdapterPositions(
              [...formattedTxns, ...deepProtocolTx],
              liveTokenList,
            );
            setDefiPositions(
              mergeDeFiPositions(
                mergeDeFiPositions(liveDefiPositions, txDerivedPositions),
                protocolAdapterPositions,
              ),
            );
          } else {
            setDefiPositions(liveDefiPositions);
          }
        } catch (transactionError) {
          console.error("Transaction fetch error:", transactionError);
          setDefiPositions(liveDefiPositions);
        }

        const total = liveTokenList.reduce(
          (sum, t) => sum + (Number(t.amount) || 0) * (Number(t.price) || 0),
          0,
        );
        setTotalValue(total);

        try {
          const historyData = await fetchHistoricalData(liveTokenList, total);
          setHistoricalChartData(historyData);

          // Keep raw floating-point precision from Gecko-derived values here;
          // formatting/rounding should only happen in the UI layer.
          if (Array.isArray(historyData) && historyData.length >= 2) {
            const latest = Number(historyData[historyData.length - 1]?.value);
            const previous = Number(historyData[historyData.length - 2]?.value);
            if (Number.isFinite(latest) && Number.isFinite(previous) && previous !== 0) {
              setDailyPnLPercentage(((latest - previous) / previous) * 100);
            } else {
              setDailyPnLPercentage(0);
            }
          } else {
            setDailyPnLPercentage(0);
          }
        } catch (historyBuildError) {
          console.error("Historical chart build error:", historyBuildError);
          setHistoricalChartData([]);
          setDailyPnLPercentage(0);
        }

        saveSnapshot(targetAddress, {
          totalValue: total,
          solBalance: sol,
          tokenCount: liveTokenList.length,
          nftCount: nftItems.length + cnftItems.length,
        }).catch((snapshotError) => {
          console.error("Snapshot save error:", snapshotError);
        });

        try {
          const { data: snapshots } = await supabase
            .from("portfolio_snapshots")
            .select("total_value_usd, created_at")
            .eq("wallet_address", targetAddress)
            .order("created_at", { ascending: true })
            .limit(30);

          if (snapshots?.length > 1) {
            setPortfolioHistory(
              snapshots.map((s) => ({
                date: new Date(s.created_at).toISOString().split("T")[0],
                timestamp: s.created_at,
                value: parseFloat(s.total_value_usd),
              })),
            );
          } else {
            setPortfolioHistory([]);
          }
        } catch (historyError) {
          console.error("Portfolio history error:", historyError);
          setPortfolioHistory([]);
        }

        setLastRefresh(new Date());
      } catch (err) {
        console.error("Portfolio refresh error:", err);
        setError(err.message);
        if (!activeAddress) {
          setIsDemo(true);
          setTokens(MOCK_TOKENS);
          setNfts(MOCK_NFTS);
          setCnfts([]);
          setDefiPositions(MOCK_DEFI);
          setTransactions(MOCK_TRANSACTIONS);
          setPortfolioHistory(MOCK_PORTFOLIO_HISTORY);
          setHistoricalChartData(
            (MOCK_PORTFOLIO_HISTORY || []).map((point) => ({
              ...point,
              totalPortfolioValue: Number(point.value) || 0,
              value: Number(point.value) || 0,
            })),
          );
          setDailyPnLPercentage(0);
          const totals = getMockPortfolioTotal();
          setTotalValue(totals.total);
        } else {
          setDefiPositions([]);
          setHistoricalChartData([]);
          setDailyPnLPercentage(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [activeAddress],
  );

  // Auto-refresh when address changes
  useEffect(() => {
    if (activeAddress) {
      refreshPortfolio();
    }
  }, [activeAddress, refreshPortfolio]);

  // Save watched wallet
  const saveWatchedWallet = useCallback(async (address, label) => {
    const { error } = await supabase
      .from("watched_wallets")
      .upsert(
        { address, label, updated_at: new Date().toISOString() },
        { onConflict: "address" },
      );
    if (error) console.error("Save wallet error:", error);
  }, []);

  const value = {
    loading,
    isLoading: loading,
    error,
    isDemo,
    activeAddress,
    solBalance,
    tokens,
    nfts,
    cnfts,
    defiPositions,
    transactions,
    portfolioHistory,
    historicalChartData,
    dailyPnLPercentage,
    totalValue,
    lastRefresh,
    manualAddress,
    setManualWallet,
    refreshPortfolio,
    saveWatchedWallet,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx)
    throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
};
