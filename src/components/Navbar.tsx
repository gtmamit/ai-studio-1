import React from 'react';
import { Box, Compass, Heart, Home, ShoppingBag } from 'lucide-react';
import { useAtelier } from '../context/AtelierContext';
import type { ScreenId } from '../types/footwear';

const NAV_ITEMS: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Catalog', icon: Home },
  { id: 'customizer', label: '3D Studio', icon: Box },
  { id: 'ar', label: 'AR Try-On', icon: Compass },
  { id: 'wishlist', label: 'Saved', icon: Heart },
];

export const Navbar: React.FC = () => {
  const { activeScreen, navigateTo, bagItems, setIsBagOpen } = useAtelier();
  const bagCount = bagItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#fcf9f8]/95 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-[52px] md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="text-base md:text-lg font-bold tracking-[-0.025em] text-[#141414] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]"
          >
            Atelier Spatial
          </button>

          {/* Zone 2: 4 Single-line Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb] ${
                    isActive
                      ? 'text-[#141414]'
                      : 'text-[#737373] hover:text-[#141414]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 -bottom-[2px] h-[1.5px] bg-[#141414]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action (Shopping Bag) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsBagOpen(true)}
              aria-label={`Open shopping bag, ${bagCount} items`}
              className="min-h-[40px] px-4 py-2 rounded-full bg-[#141414] text-white text-xs font-semibold tracking-wide flex items-center gap-2 hover:bg-[#2563eb] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag</span>
              <span className="font-mono tabular-nums text-[11px] opacity-90">({bagCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Thumb-Zone Bottom Bar (<md) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#e5e5e5] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-[56px]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors duration-150 cursor-pointer ${
                  isActive ? 'text-[#2563eb]' : 'text-[#737373] hover:text-[#141414]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold tracking-tight mt-1 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
