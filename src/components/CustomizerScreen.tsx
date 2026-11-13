import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Compass,
  Layers,
  RotateCcw,
  ShoppingBag,
  Sun,
} from 'lucide-react';
import { useAtelier } from '../context/AtelierContext';
import {
  MATERIAL_FINISHES,
  SHOE_CATALOG,
  SHOE_ZONES,
  SIZE_CHART,
  STUDIO_COLORS,
} from '../data/catalog';
import type { MaterialFinishId } from '../types/footwear';
import {
  ShoeViewport3D,
  type ShoeViewport3DHandle,
  type StudioLightingPreset,
} from './ShoeViewport3D';

function getSwatchPatternStyle(material: MaterialFinishId, hex: string): React.CSSProperties {
  if (material === 'carbon-weave') {
    return {
      backgroundColor: hex,
      backgroundImage:
        'linear-gradient(45deg, rgba(255,255,255,0.18) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.18) 75%), linear-gradient(45deg, rgba(0,0,0,0.22) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.22) 75%)',
      backgroundSize: '8px 8px',
      backgroundPosition: '0 0, 4px 4px',
    };
  }
  if (material === 'ripstop-nylon') {
    return {
      backgroundColor: hex,
      backgroundImage:
        'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)',
      backgroundSize: '6px 6px',
    };
  }
  if (material === 'brushed-suede') {
    return {
      backgroundColor: hex,
      backgroundImage:
        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), rgba(0,0,0,0.12))',
    };
  }
  if (material === 'ice-rubber') {
    return {
      backgroundColor: hex,
      backgroundImage:
        'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.1) 50%, rgba(37,99,235,0.15) 100%)',
    };
  }
  return {
    backgroundColor: hex,
    backgroundImage:
      'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.28), transparent 65%)',
  };
}

export const CustomizerScreen: React.FC = () => {
  const {
    activeShoeId,
    setActiveShoe,
    workingConfig,
    selectedZone,
    setSelectedZone,
    updateZoneConfig,
    resetWorkingConfig,
    selectedSizeUS,
    setSelectedSizeUS,
    saveCurrentEdition,
    addToBag,
    navigateTo,
  } = useAtelier();

  const viewportRef = useRef<ShoeViewport3DHandle | null>(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [lighting, setLighting] = useState<StudioLightingPreset>('daylight');

  const activeShoe = useMemo(
    () => SHOE_CATALOG.find((s) => s.id === activeShoeId) ?? SHOE_CATALOG[0],
    [activeShoeId]
  );

  const isCustomized = useMemo(() => {
    return SHOE_ZONES.some(
      (z) =>
        workingConfig[z.id].material !== activeShoe.defaultConfig[z.id].material ||
        workingConfig[z.id].color.toLowerCase() !==
          activeShoe.defaultConfig[z.id].color.toLowerCase()
    );
  }, [activeShoe, workingConfig]);

  const currentPrice = activeShoe.basePrice + (isCustomized ? activeShoe.bespokeSurcharge : 0);
  const activeZoneCfg = workingConfig[selectedZone];
  const activeZoneMeta = SHOE_ZONES.find((z) => z.id === selectedZone) ?? SHOE_ZONES[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && document.activeElement?.tagName !== 'SELECT') {
        setDockOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const cycleLighting = () => {
    setLighting((prev) =>
      prev === 'daylight' ? 'warm' : prev === 'warm' ? 'contrast' : 'daylight'
    );
  };

  return (
    <main className="relative w-full h-[calc(100vh-52px)] md:h-[calc(100vh-64px)] overflow-hidden bg-[#f4f2ef]">
      {/* Unobstructed 3D WebGL Canvas */}
      <ShoeViewport3D
        ref={viewportRef}
        mode="studio"
        config={workingConfig}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        exploded={exploded}
        lightingPreset={lighting}
      />

      {/* Top HUD Bar (Solid/Translucent without backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-3 md:top-5 inset-x-3 md:inset-x-6 z-10 flex flex-wrap items-start justify-between gap-3">
        {/* Top-Left: Silhouette Selector & Live Price */}
        <div className="pointer-events-auto bg-white/95 border border-[#e5e5e5] rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-4">
          <div>
            <label htmlFor="silhouette-select" className="sr-only">
              Select Footwear Silhouette
            </label>
            <select
              id="silhouette-select"
              value={activeShoe.id}
              onChange={(e) => setActiveShoe(e.target.value)}
              className="text-sm font-semibold text-[#141414] bg-transparent pr-2 focus:outline-none cursor-pointer"
            >
              {SHOE_CATALOG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Tap mesh or zone tab · {isCustomized ? 'Bespoke Spec' : 'Studio Default'}
            </p>
          </div>
          <div className="pl-3 border-l border-[#e5e5e5] text-right">
            <span className="font-mono tabular-nums text-base font-semibold text-[#141414]">
              ${currentPrice}
            </span>
          </div>
        </div>

        {/* Top-Right: Save Edition, Try AR, Add to Bag */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => saveCurrentEdition()}
            title="Save Bespoke Edition"
            className="min-h-[42px] px-3.5 py-2 rounded-full bg-white/95 border border-[#e5e5e5] text-[#141414] text-xs font-semibold flex items-center gap-1.5 hover:border-[#141414] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Edition</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('ar')}
            className="min-h-[42px] px-3.5 py-2 rounded-full bg-white/95 border border-[#e5e5e5] text-[#141414] text-xs font-semibold flex items-center gap-1.5 hover:border-[#2563eb] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Try in AR</span>
          </button>

          <button
            type="button"
            onClick={() =>
              addToBag({
                shoeId: activeShoe.id,
                sizeUS: selectedSizeUS,
                isBespoke: true,
                config: workingConfig,
              })
            }
            className="min-h-[42px] px-4 py-2 rounded-full bg-[#141414] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#2563eb] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="pointer-events-none fixed md:absolute bottom-[64px] md:bottom-5 inset-x-0 z-20 flex flex-col items-center px-3">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-2 px-4 py-1.5 rounded-full bg-white/95 border border-[#e5e5e5] text-[11px] font-semibold text-[#141414] flex items-center gap-1.5 shadow-sm hover:border-[#141414] transition-colors cursor-pointer"
        >
          {dockOpen ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Customize {activeZoneMeta.label}</span>
            </>
          )}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-[920px] bg-white/95 border border-[#e5e5e5] rounded-2xl p-3.5 md:p-4 shadow-md">
            {/* Row 1: Zone Selector Pills + Utility Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5e5e5]">
              <div
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
                role="tablist"
                aria-label="Shoe customization zones"
              >
                {SHOE_ZONES.map((z) => {
                  const isActive = selectedZone === z.id;
                  const zoneCfg = workingConfig[z.id];
                  return (
                    <button
                      key={z.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedZone(z.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#141414] text-white'
                          : 'bg-[#f6f3f2] text-[#737373] hover:text-[#141414]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: zoneCfg.color }}
                        aria-hidden="true"
                      />
                      <span>{z.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setExploded((v) => !v)}
                  aria-pressed={exploded}
                  className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-colors whitespace-nowrap cursor-pointer ${
                    exploded
                      ? 'bg-[#2563eb] text-white border-[#2563eb]'
                      : 'bg-white text-[#141414] border-[#e5e5e5] hover:border-[#141414]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Explode</span>
                </button>

                <button
                  type="button"
                  onClick={cycleLighting}
                  title="Cycle studio lighting preset"
                  className="min-h-[38px] px-3 py-1.5 rounded-full bg-white border border-[#e5e5e5] text-[#141414] text-xs font-medium flex items-center gap-1.5 hover:border-[#141414] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="capitalize">{lighting}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetWorkingConfig();
                    viewportRef.current?.resetCamera();
                  }}
                  title="Reset customization & angle"
                  className="min-h-[38px] min-w-[38px] px-2.5 rounded-full bg-white border border-[#e5e5e5] text-[#737373] hover:text-[#141414] hover:border-[#141414] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Row 2: Material Finishes + Color Swatches + US Size */}
            <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Material Finish Swatches (40x40px spheres) */}
              <div className="md:col-span-5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                    {activeZoneMeta.label} Material
                  </span>
                  <span className="text-xs font-medium text-[#141414]">
                    {MATERIAL_FINISHES.find((m) => m.id === activeZoneCfg.material)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
                  {MATERIAL_FINISHES.map((mat) => {
                    const selected = activeZoneCfg.material === mat.id;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => updateZoneConfig(selectedZone, { material: mat.id })}
                        title={mat.label}
                        aria-label={`${mat.label} finish`}
                        className={`w-10 h-10 rounded-full shrink-0 border border-black/15 transition-transform cursor-pointer ${
                          selected
                            ? 'ring-2 ring-[#2563eb] ring-offset-2 scale-105'
                            : 'hover:scale-105'
                        }`}
                        style={getSwatchPatternStyle(mat.id, activeZoneCfg.color)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Studio Colorway Swatches */}
              <div className="md:col-span-5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                    Pigment
                  </span>
                  <span className="text-xs font-medium text-[#141414]">
                    {activeZoneCfg.colorName}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {STUDIO_COLORS.map((swatch) => {
                    const selected =
                      activeZoneCfg.color.toLowerCase() === swatch.hex.toLowerCase();
                    return (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() =>
                          updateZoneConfig(selectedZone, {
                            color: swatch.hex,
                            colorName: swatch.name,
                          })
                        }
                        title={swatch.name}
                        aria-label={`Color ${swatch.name}`}
                        className={`w-8 h-8 rounded-full shrink-0 border border-black/15 transition-transform cursor-pointer ${
                          selected
                            ? 'ring-2 ring-[#2563eb] ring-offset-2 scale-105'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* US Size Selector */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">
                  Size
                </span>
                <select
                  aria-label="Select US shoe size"
                  value={selectedSizeUS}
                  onChange={(e) => setSelectedSizeUS(Number(e.target.value))}
                  className="min-h-[40px] px-3 rounded-full bg-[#f6f3f2] border border-[#e5e5e5] text-xs font-mono tabular-nums font-semibold text-[#141414] focus:outline-none focus:border-[#2563eb] cursor-pointer"
                >
                  {SIZE_CHART.map((sz) => (
                    <option key={sz.us} value={sz.us}>
                      US {sz.us} / EU {sz.eu}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
