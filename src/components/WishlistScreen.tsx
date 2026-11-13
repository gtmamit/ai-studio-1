import React, { useState } from 'react';
import { ArrowRight, Box, Compass, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useAtelier } from '../context/AtelierContext';
import { MATERIAL_FINISHES, SHOE_CATALOG, SHOE_ZONES } from '../data/catalog';
import { StudioImage } from './StudioImage';

export const WishlistScreen: React.FC = () => {
  const {
    wishlistIds,
    savedEditions,
    toggleWishlist,
    loadEdition,
    deleteEdition,
    addToBag,
    navigateTo,
    selectedSizeUS,
  } = useAtelier();

  const [tab, setTab] = useState<'editions' | 'silhouettes'>('editions');

  const savedShoes = SHOE_CATALOG.filter((s) => wishlistIds.includes(s.id));

  return (
    <main className="max-w-7xl mx-auto px-5 md:px-8 pt-6 md:pt-10 pb-28 md:pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#e5e5e5]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
            Personal Archive
          </p>
          <h1 className="mt-1.5 text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-[#141414]">
            Wishlist & Saved Editions
          </h1>
        </div>

        <div className="flex items-center gap-1.5 bg-[#f0edec] p-1 rounded-full self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTab('editions')}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'editions'
                ? 'bg-white text-[#141414] shadow-xs'
                : 'text-[#737373] hover:text-[#141414]'
            }`}
          >
            Bespoke Editions ({savedEditions.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('silhouettes')}
            className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === 'silhouettes'
                ? 'bg-white text-[#141414] shadow-xs'
                : 'text-[#737373] hover:text-[#141414]'
            }`}
          >
            Saved Silhouettes ({savedShoes.length})
          </button>
        </div>
      </div>

      {tab === 'editions' ? (
        savedEditions.length === 0 ? (
          <div className="mt-10 bg-white border border-[#e5e5e5] rounded-2xl p-10 text-center max-w-xl mx-auto">
            <p className="text-base font-semibold text-[#141414]">No saved bespoke editions yet</p>
            <p className="mt-2 text-sm text-[#737373]">
              Open the 3D Studio to customize materials and colors across five anatomical zones, then
              save your specification here.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('customizer')}
              className="mt-6 min-h-[46px] px-6 py-2.5 rounded-full bg-[#141414] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#2563eb] transition-colors cursor-pointer"
            >
              <Box className="w-4 h-4" />
              <span>Open 3D Studio</span>
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedEditions.map((edition) => {
              const baseShoe = SHOE_CATALOG.find((s) => s.id === edition.shoeId) ?? SHOE_CATALOG[0];
              return (
                <article
                  key={edition.editionId}
                  className="bg-white border border-[#e5e5e5] rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                          {edition.shoeName} · {edition.createdAt}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-[#141414]">
                          {edition.title}
                        </h2>
                      </div>
                      <span className="font-mono tabular-nums text-base font-medium text-[#141414]">
                        ${edition.unitPrice}
                      </span>
                    </div>

                    {/* 5-Zone Material & Color Recipe Breakdown */}
                    <div className="mt-5 space-y-2.5 pt-4 border-t border-[#e5e5e5]">
                      {SHOE_ZONES.map((z) => {
                        const zoneCfg = edition.configSnapshot[z.id];
                        const matLabel =
                          MATERIAL_FINISHES.find((m) => m.id === zoneCfg.material)?.label ??
                          zoneCfg.material;
                        return (
                          <div
                            key={z.id}
                            className="flex items-center justify-between text-xs gap-3"
                          >
                            <span className="font-medium text-[#737373] w-16">{z.label}</span>
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                                style={{ backgroundColor: zoneCfg.color }}
                                aria-hidden="true"
                              />
                              <span className="text-[#141414] font-medium truncate">
                                {zoneCfg.colorName}
                              </span>
                              <span className="text-[#737373] hidden sm:inline">· {matLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#e5e5e5] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadEdition(edition, 'customizer')}
                      className="flex-1 min-h-[42px] px-3.5 py-2 rounded-full bg-[#141414] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#2563eb] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Box className="w-3.5 h-3.5" />
                      <span>Edit 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadEdition(edition, 'ar')}
                      className="min-h-[42px] px-3.5 py-2 rounded-full bg-white border border-[#e5e5e5] text-[#141414] text-xs font-medium flex items-center gap-1.5 hover:border-[#141414] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>AR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addToBag({
                          shoeId: baseShoe.id,
                          sizeUS: selectedSizeUS,
                          isBespoke: true,
                          config: edition.configSnapshot,
                        })
                      }
                      aria-label={`Add ${edition.title} to bag`}
                      className="min-h-[42px] min-w-[42px] px-3 rounded-full bg-[#f6f3f2] border border-[#e5e5e5] text-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEdition(edition.editionId)}
                      aria-label={`Delete ${edition.title}`}
                      className="min-h-[42px] min-w-[42px] rounded-full bg-white border border-[#e5e5e5] text-[#737373] flex items-center justify-center hover:text-[#ba1a1a] hover:border-[#ba1a1a] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : savedShoes.length === 0 ? (
        <div className="mt-10 bg-white border border-[#e5e5e5] rounded-2xl p-10 text-center max-w-xl mx-auto">
          <p className="text-base font-semibold text-[#141414]">Your wishlist is empty</p>
          <p className="mt-2 text-sm text-[#737373]">
            Tap the heart icon on any silhouette in the catalog to bookmark it for quick 3D and AR
            comparison.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="mt-6 min-h-[46px] px-6 py-2.5 rounded-full bg-[#141414] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#2563eb] transition-colors cursor-pointer"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedShoes.map((shoe) => (
            <article
              key={shoe.id}
              className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-[#f6f3f2]">
                <StudioImage
                  src={shoe.image}
                  alt={shoe.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => toggleWishlist(shoe.id)}
                  aria-label={`Remove ${shoe.name} from wishlist`}
                  className="absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-[#2563eb] cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-[#2563eb]" />
                </button>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                    {shoe.category} · {shoe.specs.upperMaterial}
                  </p>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold text-[#141414]">{shoe.name}</h3>
                    <span className="font-mono tabular-nums text-[15px] font-medium text-[#141414]">
                      ${shoe.basePrice}
                    </span>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-[#e5e5e5] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('customizer', shoe.id)}
                    className="flex-1 min-h-[42px] px-4 py-2 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors cursor-pointer"
                  >
                    Customize in 3D
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      addToBag({
                        shoeId: shoe.id,
                        sizeUS: selectedSizeUS,
                        isBespoke: false,
                      })
                    }
                    className="min-h-[42px] px-4 py-2 rounded-full bg-[#f6f3f2] border border-[#e5e5e5] text-[#141414] text-xs font-semibold hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};
