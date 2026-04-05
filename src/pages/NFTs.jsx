import { useEffect, useState } from "react";
import { usePortfolio } from "../lib/portfolio-context";
import {
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

export default function NFTs() {
  const { nfts, cnfts, isLoading } = usePortfolio();
  const [activeTab, setActiveTab] = useState("nft");
  const [expandedCollections, setExpandedCollections] = useState({});
  const [selectedNft, setSelectedNft] = useState(null);

  const getMagicEdenUrl = (nft) =>
    nft?.mint ? `https://magiceden.io/item-details/${nft.mint}` : null;
  const getSolscanUrl = (nft) =>
    nft?.mint ? `https://solscan.io/token/${nft.mint}` : null;
  const getTensorUrl = (nft) =>
    nft?.mint ? `https://www.tensor.trade/item/${nft.mint}` : null;

  const renderFieldValue = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";
    return value;
  };

  useEffect(() => {
    if (!selectedNft) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedNft(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedNft]);

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      if ((a?.isVerified || false) !== (b?.isVerified || false))
        return a?.isVerified ? -1 : 1;
      return (b?.floorPrice || 0) - (a?.floorPrice || 0);
    });
  };

  const groupByCollection = (items) => {
    const grouped = items.reduce((acc, item) => {
      const col = item.collection || "Unknown";
      if (!acc[col]) acc[col] = [];
      acc[col].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, collectionItems]) => [name, sortItems(collectionItems)])
      .sort((a, b) => {
        const aItems = a[1];
        const bItems = b[1];
        const aVerified = aItems.some((item) => item?.isVerified);
        const bVerified = bItems.some((item) => item?.isVerified);
        if (aVerified !== bVerified) return aVerified ? -1 : 1;

        const aFloor = Math.max(...aItems.map((item) => item?.floorPrice || 0), 0);
        const bFloor = Math.max(...bItems.map((item) => item?.floorPrice || 0), 0);
        if (aFloor !== bFloor) return bFloor - aFloor;

        return bItems.length - aItems.length;
      });
  };

  const nftCollections = groupByCollection(nfts);
  const cnftCollections = groupByCollection(cnfts);
  const allCollections = [...nftCollections, ...cnftCollections];
  const activeCollections = activeTab === "nft" ? nftCollections : cnftCollections;

  const toggleCollection = (collectionName) => {
    const key = `${activeTab}:${collectionName}`;
    setExpandedCollections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-base-200 border border-base-300 rounded-xl overflow-hidden">
          <div className="skeleton h-48 w-full rounded-lg" />
          <div className="p-3 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-base-content">NFT Collection</h1>
        {isLoading ? (
          <div className="skeleton h-5 w-80 mt-2" />
        ) : (
          <p className="text-sm text-base-content/70 mt-1">
            {nfts.length} NFTs and {cnfts.length} cNFTs across {allCollections.length} collections
          </p>
        )}
      </div>

      {/* Type Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-4">
                <div className="skeleton h-3 w-24 mb-4" />
                <div className="skeleton h-8 w-1/2" />
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body p-4">
                <div className="skeleton h-3 w-36 mb-4" />
                <div className="skeleton h-8 w-1/2" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-base-200 border border-base-300 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-base-content/70 mb-2">NFTs</p>
              <p className="text-2xl font-bold text-base-content">{nfts.length}</p>
            </div>
            <div className="bg-base-200 border border-base-300 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-base-content/70 mb-2">Compressed NFTs</p>
              <p className="text-2xl font-bold text-base-content">{cnfts.length}</p>
            </div>
          </>
        )}
      </div>

      {/* NFT/cNFT Tabs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab("nft")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeTab === "nft"
                ? "bg-primary/15 border-primary/40 text-base-content"
                : "bg-base-200 border-base-300 text-base-content/70 hover:text-base-content"
            }`}
          >
            NFTs ({nfts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cnft")}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              activeTab === "cnft"
                ? "bg-primary/15 border-primary/40 text-base-content"
                : "bg-base-200 border-base-300 text-base-content/70 hover:text-base-content"
            }`}
          >
            cNFTs ({cnfts.length})
          </button>
        </div>

        <div className="space-y-5">
          {isLoading ? (
            <SkeletonGrid />
          ) : (
            activeCollections.map(([collectionName, items]) => (
              <section
                key={`${activeTab}-${collectionName}`}
                className="bg-base-200 border border-base-300 rounded-xl p-4"
              >
                {(() => {
                  const collectionKey = `${activeTab}:${collectionName}`;
                  const isExpanded = Boolean(expandedCollections[collectionKey]);
                  const visibleItems = isExpanded ? items : items.slice(0, 4);
                  const gridClassName = isExpanded
                    ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4";

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleCollection(collectionName)}
                        className="w-full flex items-center justify-between mb-3 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {items[0]?.collectionImage ? (
                            <img
                              src={items[0].collectionImage}
                              alt={collectionName}
                              className="w-5 h-5 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center">
                              <ImageIcon className="w-3 h-3 text-base-content/70" />
                            </div>
                          )}
                          <h3 className="text-sm font-medium text-base-content truncate">
                            {collectionName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-base-content/70 bg-base-300 px-2 py-0.5 rounded-full">
                            {items.length}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-base-content/70" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-base-content/70" />
                          )}
                        </div>
                      </button>

                      {items[0]?.floorPrice > 0 && (
                        <div className="space-y-1 text-xs mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-base-content/70">Floor</span>
                            <span className="text-base-content font-medium">
                              {items[0].floorPrice.toFixed(2)} SOL
                            </span>
                          </div>
                          {items[0]?.collectionOffer > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-base-content/70">Top Offer</span>
                              <span className="text-success font-medium">
                                {items[0].collectionOffer.toFixed(2)} SOL
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={gridClassName}>
                        {visibleItems.map((nft, i) => (
                          <button
                            type="button"
                            key={`${nft.mint || nft.id || i}`}
                            onClick={() => setSelectedNft(nft)}
                            className="text-left bg-base-200 border border-base-300 rounded-xl overflow-hidden hover:border-primary/30 hover:-translate-y-0.5 transition-all group"
                          >
                            <div className="aspect-square bg-base-300 flex items-center justify-center">
                              {nft.image ? (
                                <img
                                  src={nft.image}
                                  alt={nft.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <ImageIcon className="w-8 h-8 text-base-content/70" />
                                  <span className="text-xs text-base-content/70">No Preview</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h4 className="text-sm font-medium text-base-content truncate">
                                {nft.name}
                              </h4>
                            </div>
                          </button>
                        ))}
                      </div>

                      {items.length > 4 && !isExpanded && (
                        <button
                          type="button"
                          onClick={() => toggleCollection(collectionName)}
                          className="mt-3 text-xs text-primary hover:text-base-content transition-colors"
                        >
                          Show all {items.length} items
                        </button>
                      )}

                      {items.length > 4 && isExpanded && (
                        <button
                          type="button"
                          onClick={() => toggleCollection(collectionName)}
                          className="mt-3 text-xs text-base-content/70 hover:text-base-content transition-colors"
                        >
                          Show less
                        </button>
                      )}
                    </>
                  );
                })()}
              </section>
            ))
          )}

          {!isLoading && activeCollections.length === 0 && (
            <div className="bg-base-200 border border-base-300 rounded-xl p-6 text-center text-sm text-base-content/70">
              {activeTab === "nft"
                ? "No NFTs found for this wallet."
                : "No cNFTs found for this wallet."}
            </div>
          )}
        </div>
      </div>

      {selectedNft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close NFT details"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedNft(null)}
          />

          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-base-200 border border-base-300 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-200/95 backdrop-blur">
              <div>
                <h3 className="text-lg font-semibold text-base-content">
                  {selectedNft.name || "Unknown NFT"}
                </h3>
                <p className="text-xs text-base-content/70">
                  {selectedNft.collection || "Unknown Collection"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNft(null)}
                className="p-2 rounded-lg border border-base-300 text-base-content/70 hover:text-base-content hover:border-primary/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-base-300 bg-base-300">
                  {selectedNft.image ? (
                    <img
                      src={selectedNft.image}
                      alt={selectedNft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="aspect-square flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-12 h-12 text-base-content/70" />
                      <span className="text-sm text-base-content/70">No Preview</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {getMagicEdenUrl(selectedNft) && (
                    <a
                      href={getMagicEdenUrl(selectedNft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-2 rounded-lg border border-base-300 text-base-content/70 hover:text-base-content hover:border-primary/40 transition-colors inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in Magic Eden
                    </a>
                  )}
                  {getTensorUrl(selectedNft) && (
                    <a
                      href={getTensorUrl(selectedNft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-2 rounded-lg border border-base-300 text-base-content/70 hover:text-base-content hover:border-primary/40 transition-colors inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in Tensor
                    </a>
                  )}
                  {getSolscanUrl(selectedNft) && (
                    <a
                      href={getSolscanUrl(selectedNft)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-2 rounded-lg border border-base-300 text-base-content/70 hover:text-base-content hover:border-primary/40 transition-colors inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in Solscan
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <section className="rounded-xl border border-base-300 p-3">
                  <h4 className="text-sm font-semibold text-base-content mb-3">Details</h4>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                      <span className="text-xs text-base-content/70">Mint</span>
                      <span className="text-sm text-base-content break-all">{renderFieldValue(selectedNft.mint)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                      <span className="text-xs text-base-content/70">Collection</span>
                      <span className="text-sm text-base-content break-words">{renderFieldValue(selectedNft.collection)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                      <span className="text-xs text-base-content/70">Token Standard</span>
                      <span className="text-sm text-base-content">{renderFieldValue(selectedNft.tokenStandard)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                      <span className="text-xs text-base-content/70">Type</span>
                      <span className="text-sm text-base-content">{selectedNft.isCompressed ? "cNFT" : "NFT"}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                      <span className="text-xs text-base-content/70">Owner</span>
                      <span className="text-sm text-base-content break-all">{renderFieldValue(selectedNft.owner)}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                      <span className="text-xs text-base-content/70">Royalty</span>
                      <span className="text-sm text-base-content">
                        {selectedNft.royaltyPercent !== null && selectedNft.royaltyPercent !== undefined
                          ? `${selectedNft.royaltyPercent.toFixed(2)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </section>

                {selectedNft.attributes && selectedNft.attributes.length > 0 && (
                  <section className="rounded-xl border border-base-300 p-3">
                    <h4 className="text-sm font-semibold text-base-content mb-3">Attributes</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedNft.attributes.map((attr, i) => (
                        <div key={i} className="flex items-center justify-between bg-base-300/50 rounded-lg px-3 py-2">
                          <span className="text-xs text-base-content/70 font-medium">{attr.traitType}</span>
                          <span className="text-sm text-base-content font-semibold">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}