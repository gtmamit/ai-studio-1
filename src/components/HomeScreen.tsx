import React, { useMemo, useState } from 'react';
import { ArrowRight, Box, Compass, Heart, Plus } from 'lucide-react';
import { useAtelier } from '../context/AtelierContext';
import { HERO_ASSET, SHOE_CATALOG } from '../data/catalog';
import type { ShoeCategory } from '../types/footwear';
import { StudioImage } from './StudioImage';

type FilterTab = 'All' | ShoeCategory;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'All', label: 'All Silhouettes' },
  { id: 'Runners', label: 'Runners' },
  { id: 'Architectural', label: 'Architectural' },
  { id: 'Limited Run', label: 'Limited Run' },
];

export const HomeScreen: React.FC = () => {
  const { navigateTo, wishlistIds, toggleWishlist, addToBag, selectedSizeUS } = useAtelier();
  const [filter, setFilter] = useState<FilterTab>('All');

  const filteredShoes = useMemo(() => {
    if (filter === 'All') return SHOE_CATALOG;
    return SHOE_CATALOG.filter((s) => s.category === filter);
  }, [filter]);

  return (
    <main className="pb-24 md:pb-16">
      {/* Section 1: Editorial Storefront Hero */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-6 md:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          <div className="lg:col-span-5 bg-white border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
                Milan Studio · Series 01–03
              </p>
              <h1
                className="mt-4 text-[32px] md:text-[42px] font-bold leading-[1.12] tracking-[-0.03em] text-[#141414]"
                style={{ textWrap: 'balance' }}
              >
                Architectural footwear shaped for spatial craft.
              </h1>
              <p className="mt-4 text-[15px] md:text-base leading-relaxed text-[#737373] max-w-[44ch]">
                Configure every panel in real-time 3D with full-grain leather, ripstop weave, and
                forged carbon, then verify millimeter proportions directly on your floor in AR.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[#e5e5e5] flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigateTo('customizer', 'monolith-v1')}
                className="min-h-[48px] px-6 py-3 rounded-full bg-[#141414] text-white text-sm font-semibold flex items-center gap-2.5 hover:bg-[#2563eb] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Box className="w-4 h-4" />
                <span>Launch 3D Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo('ar', 'monolith-v1')}
                className="min-h-[48px] px-5 py-3 rounded-full bg-white border border-[#e5e5e5] text-[#141414] text-sm font-medium flex items-center gap-2 hover:border-[#141414] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#2563eb]" />
                <span>AR Try-On</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#e5e5e5] bg-[#f0edec] min-h-[280px] sm:min-h-[360px]">
            <StudioImage
              src={HERO_ASSET}
              alt="Monolith V1 Atelier luxury sneaker resting on a travertine stone plinth"
              className="w-full h-full object-cover"
              fallbackLabel="Monolith V1 Atelier"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 bg-gradient-to-t from-black/65 via-black/25 to-transparent flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                  Flagship Release · Travertine Edition
                </p>
                <p className="text-lg md:text-xl font-semibold text-white tracking-[-0.015em] mt-0.5">
                  Monolith V1 Atelier
                </p>
              </div>
              <span className="font-mono tabular-nums text-base md:text-lg font-medium text-white shrink-0">
                $480
              </span>
            </div>
          </div>
        </div>

        {/* 4-Column Architectural Metrics Strip */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Chassis Mass', value: '285 g', detail: 'Dual-density Pebax core' },
            { label: 'Heel-to-Toe Drop', value: '8.0 mm', detail: 'Anatomical rocker last' },
            { label: 'Bespoke Surfaces', value: '5 Zones', detail: 'PBR tactile material map' },
            { label: 'AR Calibration', value: '1:1 mm', detail: 'US 7–13 true floor scale' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[#e5e5e5] rounded-2xl px-5 py-4 flex flex-col justify-between"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                {stat.label}
              </span>
              <span className="mt-1.5 text-xl md:text-2xl font-semibold tracking-[-0.02em] font-mono tabular-nums text-[#141414]">
                {stat.value}
              </span>
              <span className="mt-1 text-xs text-[#737373]">{stat.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Curated Collection Grid */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 mt-12 md:mt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#e5e5e5]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
              Studio Collection
            </p>
            <h2 className="mt-1.5 text-2xl md:text-[28px] font-semibold tracking-[-0.02em] text-[#141414]">
              Select a silhouette to configure
            </h2>
          </div>

          {/* Interactive Category Filter Controls */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
            role="tablist"
            aria-label="Filter footwear silhouettes"
          >
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#141414] text-white'
                      : 'bg-white border border-[#e5e5e5] text-[#737373] hover:text-[#141414] hover:border-[#141414]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredShoes.map((shoe) => {
            const isSaved = wishlistIds.includes(shoe.id);
            return (
              <article
                key={shoe.id}
                className="group bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
              >
                {/* Studio Product Image */}
                <div className="relative aspect-[4/3] bg-[#f6f3f2] overflow-hidden">
                  <StudioImage
                    src={shoe.image}
                    alt={`${shoe.name} studio side profile`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    fallbackLabel={shoe.name}
                  />

                  <button
                    type="button"
                    onClick={() => toggleWishlist(shoe.id)}
                    aria-label={
                      isSaved
                        ? `Remove ${shoe.name} from wishlist`
                        : `Save ${shoe.name} to wishlist`
                    }
                    className="absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-full bg-white/90 border border-[#e5e5e5] flex items-center justify-center text-[#141414] hover:border-[#141414] transition-colors cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isSaved ? 'fill-[#2563eb] text-[#2563eb]' : 'text-[#141414]'
                      }`}
                    />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                      <span>{shoe.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{shoe.specs.upperMaterial}</span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[#141414]">
                        {shoe.name}
                      </h3>
                      <span className="font-mono tabular-nums text-[15px] font-medium text-[#141414] shrink-0">
                        ${shoe.basePrice}
                      </span>
                    </div>

                    <p className="mt-2 text-[13px] leading-relaxed text-[#737373] line-clamp-2">
                      {shoe.description}
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 pt-4 border-t border-[#e5e5e5] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('customizer', shoe.id)}
                      className="flex-1 min-h-[42px] px-3.5 py-2 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#2563eb] transition-colors duration-150 whitespace-nowrap cursor-pointer"
                    >
                      Customize 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('ar', shoe.id)}
                      aria-label={`Try ${shoe.name} in AR`}
                      className="min-h-[42px] px-3.5 py-2 rounded-full bg-white border border-[#e5e5e5] text-[#141414] text-xs font-medium hover:border-[#141414] transition-colors duration-150 whitespace-nowrap cursor-pointer"
                    >
                      AR
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
                      aria-label={`Quick add ${shoe.name} US ${selectedSizeUS} to bag`}
                      className="min-w-[42px] min-h-[42px] rounded-full bg-[#f6f3f2] border border-[#e5e5e5] text-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors duration-150 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 3: Material Craftsmanship & Spatial Workflow */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 mt-14 md:mt-20">
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
              01 · Material Library
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em] text-[#141414]">
              Physically calibrated surfaces
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#737373]">
              Inspect pebble grain calfskin, high-tenacity ripstop nylon, velvety split suede, and
              2x2 twill carbon under studio directional softboxes.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
              02 · Spatial Try-On
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em] text-[#141414]">
              Sub-millimeter floor calibration
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#737373]">
              Lock your bespoke silhouette onto hardwood, concrete, or a live camera plane scaled to
              exact US and EU last dimensions.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737373]">
              03 · Made to Order
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.01em] text-[#141414]">
              Archived bespoke recipes
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#737373]">
              Store unlimited custom editions in your Atelier Archive to revisit, refine in 3D, or
              commission straight from your shopping bag.
            </p>
          </div>
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="max-w-7xl mx-auto px-5 md:px-8 mt-14 pt-8 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#737373]">
        <span>Atelier Spatial · Milan Footwear Architecture</span>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigateTo('customizer')}
            className="hover:text-[#141414] transition-colors cursor-pointer"
          >
            3D Studio
          </button>
          <button
            type="button"
            onClick={() => navigateTo('ar')}
            className="hover:text-[#141414] transition-colors cursor-pointer"
          >
            AR Try-On
          </button>
          <button
            type="button"
            onClick={() => navigateTo('wishlist')}
            className="hover:text-[#141414] transition-colors cursor-pointer"
          >
            Saved Editions
          </button>
        </div>
      </footer>
    </main>
  );
};
