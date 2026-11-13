import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SHOE_CATALOG } from '../data/catalog';
import type {
  BagItem,
  OrderRecord,
  SavedEdition,
  ScreenId,
  ShoeConfig,
  ShoeZoneId,
  ZoneConfig,
} from '../types/footwear';

interface AtelierContextValue {
  activeScreen: ScreenId;
  activeShoeId: string;
  workingConfig: ShoeConfig;
  selectedZone: ShoeZoneId;
  selectedSizeUS: number;
  wishlistIds: string[];
  savedEditions: SavedEdition[];
  bagItems: BagItem[];
  orders: OrderRecord[];
  isBagOpen: boolean;
  toastMessage: string | null;

  navigateTo: (screen: ScreenId, shoeId?: string, configOverride?: ShoeConfig) => void;
  setActiveShoe: (shoeId: string, preserveConfig?: boolean) => void;
  setSelectedZone: (zone: ShoeZoneId) => void;
  updateZoneConfig: (zone: ShoeZoneId, patch: Partial<ZoneConfig>) => void;
  resetWorkingConfig: () => void;
  setSelectedSizeUS: (size: number) => void;
  toggleWishlist: (shoeId: string) => void;
  saveCurrentEdition: (customTitle?: string) => void;
  loadEdition: (edition: SavedEdition, targetScreen?: 'customizer' | 'ar') => void;
  deleteEdition: (editionId: string) => void;
  addToBag: (options: {
    shoeId: string;
    sizeUS: number;
    isBespoke: boolean;
    config?: ShoeConfig;
    openDrawer?: boolean;
  }) => void;
  updateBagQty: (lineId: string, delta: number) => void;
  removeFromBag: (lineId: string) => void;
  setIsBagOpen: (open: boolean) => void;
  placeOrder: (details: {
    recipientName: string;
    city: string;
    deliveryTier: 'standard' | 'priority';
  }) => OrderRecord;
  showToast: (message: string) => void;
}

const STORAGE_KEYS = {
  wishlist: 'atelier_spatial_wishlist_v1',
  editions: 'atelier_spatial_editions_v1',
  bag: 'atelier_spatial_bag_v1',
  orders: 'atelier_spatial_orders_v1',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function cloneConfig(config: ShoeConfig): ShoeConfig {
  return {
    vamp: { ...config.vamp },
    swoop: { ...config.swoop },
    outsole: { ...config.outsole },
    laces: { ...config.laces },
    lining: { ...config.lining },
  };
}

function configsEqual(a: ShoeConfig, b: ShoeConfig): boolean {
  const zones: ShoeZoneId[] = ['vamp', 'swoop', 'outsole', 'laces', 'lining'];
  return zones.every(
    (z) => a[z].material === b[z].material && a[z].color.toLowerCase() === b[z].color.toLowerCase()
  );
}

const AtelierContext = createContext<AtelierContextValue | null>(null);

export const AtelierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultShoe = SHOE_CATALOG[0];

  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [activeShoeId, setActiveShoeId] = useState<string>(defaultShoe.id);
  const [workingConfig, setWorkingConfig] = useState<ShoeConfig>(() =>
    cloneConfig(defaultShoe.defaultConfig)
  );
  const [selectedZone, setSelectedZone] = useState<ShoeZoneId>('vamp');
  const [selectedSizeUS, setSelectedSizeUS] = useState<number>(10);

  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    readJson<string[]>(STORAGE_KEYS.wishlist, ['monolith-v1'])
  );
  const [savedEditions, setSavedEditions] = useState<SavedEdition[]>(() =>
    readJson<SavedEdition[]>(STORAGE_KEYS.editions, [
      {
        editionId: 'ed-studio-cobalt',
        shoeId: 'aero-cobalt',
        shoeName: 'Aero Vector Cobalt',
        title: 'Cobalt Carbon Spec',
        createdAt: '2026-11-10',
        unitPrice: 585,
        configSnapshot: {
          vamp: { material: 'ripstop-nylon', color: '#EDEAE4', colorName: 'Chalk Bone' },
          swoop: { material: 'carbon-weave', color: '#2563EB', colorName: 'Electric Cobalt' },
          outsole: { material: 'ice-rubber', color: '#DCE7F7', colorName: 'Glacier Ice' },
          laces: { material: 'ripstop-nylon', color: '#18181B', colorName: 'Obsidian Ink' },
          lining: { material: 'brushed-suede', color: '#18181B', colorName: 'Obsidian Ink' },
        },
      },
    ])
  );
  const [bagItems, setBagItems] = useState<BagItem[]>(() =>
    readJson<BagItem[]>(STORAGE_KEYS.bag, [])
  );
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    readJson<OrderRecord[]>(STORAGE_KEYS.orders, [])
  );

  const [isBagOpen, setIsBagOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlistIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.editions, JSON.stringify(savedEditions));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedEditions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.bag, JSON.stringify(bagItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [bagItems]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    } catch {
      // Ignore storage quota errors
    }
  }, [orders]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const setActiveShoe = useCallback((shoeId: string, preserveConfig = false) => {
    const shoe = SHOE_CATALOG.find((s) => s.id === shoeId) ?? SHOE_CATALOG[0];
    setActiveShoeId(shoe.id);
    if (!preserveConfig) {
      setWorkingConfig(cloneConfig(shoe.defaultConfig));
    }
  }, []);

  const navigateTo = useCallback(
    (screen: ScreenId, shoeId?: string, configOverride?: ShoeConfig) => {
      if (shoeId) {
        const shoe = SHOE_CATALOG.find((s) => s.id === shoeId) ?? SHOE_CATALOG[0];
        setActiveShoeId(shoe.id);
        setWorkingConfig(cloneConfig(configOverride ?? shoe.defaultConfig));
      } else if (configOverride) {
        setWorkingConfig(cloneConfig(configOverride));
      }
      setActiveScreen(screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const updateZoneConfig = useCallback((zone: ShoeZoneId, patch: Partial<ZoneConfig>) => {
    setWorkingConfig((prev) => ({
      ...prev,
      [zone]: {
        ...prev[zone],
        ...patch,
      },
    }));
  }, []);

  const resetWorkingConfig = useCallback(() => {
    const shoe = SHOE_CATALOG.find((s) => s.id === activeShoeId) ?? SHOE_CATALOG[0];
    setWorkingConfig(cloneConfig(shoe.defaultConfig));
    showToast('Reset to original studio recipe');
  }, [activeShoeId, showToast]);

  const toggleWishlist = useCallback(
    (shoeId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(shoeId);
        const next = exists ? prev.filter((id) => id !== shoeId) : [shoeId, ...prev];
        showToast(exists ? 'Removed from Wishlist' : 'Saved silhouette to Wishlist');
        return next;
      });
    },
    [showToast]
  );

  const saveCurrentEdition = useCallback(
    (customTitle?: string) => {
      const shoe = SHOE_CATALOG.find((s) => s.id === activeShoeId) ?? SHOE_CATALOG[0];
      const isModified = !configsEqual(workingConfig, shoe.defaultConfig);
      const unitPrice = shoe.basePrice + (isModified ? shoe.bespokeSurcharge : 0);
      const editionCount = savedEditions.length + 1;
      const newEdition: SavedEdition = {
        editionId: `ed-${Date.now()}`,
        shoeId: shoe.id,
        shoeName: shoe.name,
        title:
          customTitle?.trim() ||
          `${workingConfig.vamp.colorName.split(' ')[0]} / ${workingConfig.swoop.colorName.split(' ')[0]} Spec #${editionCount}`,
        createdAt: new Date().toISOString().slice(0, 10),
        unitPrice,
        configSnapshot: cloneConfig(workingConfig),
      };
      setSavedEditions((prev) => [newEdition, ...prev]);
      showToast(`Saved "${newEdition.title}" to Saved Editions`);
    },
    [activeShoeId, savedEditions.length, showToast, workingConfig]
  );

  const loadEdition = useCallback(
    (edition: SavedEdition, targetScreen: 'customizer' | 'ar' = 'customizer') => {
      setActiveShoeId(edition.shoeId);
      setWorkingConfig(cloneConfig(edition.configSnapshot));
      setActiveScreen(targetScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const deleteEdition = useCallback(
    (editionId: string) => {
      setSavedEditions((prev) => prev.filter((e) => e.editionId !== editionId));
      showToast('Edition removed');
    },
    [showToast]
  );

  const addToBag = useCallback(
    ({
      shoeId,
      sizeUS,
      isBespoke,
      config,
      openDrawer = true,
    }: {
      shoeId: string;
      sizeUS: number;
      isBespoke: boolean;
      config?: ShoeConfig;
      openDrawer?: boolean;
    }) => {
      const shoe = SHOE_CATALOG.find((s) => s.id === shoeId) ?? SHOE_CATALOG[0];
      const activeCfg = cloneConfig(config ?? shoe.defaultConfig);
      const modified = isBespoke && !configsEqual(activeCfg, shoe.defaultConfig);
      const unitPrice = shoe.basePrice + (modified ? shoe.bespokeSurcharge : 0);

      setBagItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) =>
            item.shoeId === shoe.id &&
            item.sizeUS === sizeUS &&
            item.isBespoke === modified &&
            configsEqual(item.configSnapshot, activeCfg)
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          return updated;
        }
        return [
          {
            lineId: `bag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            shoeId: shoe.id,
            name: shoe.name,
            image: shoe.image,
            sizeUS,
            quantity: 1,
            unitPrice,
            isBespoke: modified,
            configSnapshot: activeCfg,
          },
          ...prev,
        ];
      });

      showToast(`Added ${shoe.name} (US ${sizeUS}) to Bag`);
      if (openDrawer) {
        setIsBagOpen(true);
      }
    },
    [showToast]
  );

  const updateBagQty = useCallback((lineId: string, delta: number) => {
    setBagItems((prev) =>
      prev
        .map((item) =>
          item.lineId === lineId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromBag = useCallback((lineId: string) => {
    setBagItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const placeOrder = useCallback(
    (details: {
      recipientName: string;
      city: string;
      deliveryTier: 'standard' | 'priority';
    }): OrderRecord => {
      const subtotal = bagItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const shipping = details.deliveryTier === 'priority' ? 25 : subtotal >= 450 ? 0 : 18;
      const tax = Math.round(subtotal * 0.0825);
      const total = subtotal + shipping + tax;
      const orderNumber = `AS-${Math.floor(1000 + Math.random() * 9000)}`;

      const record: OrderRecord = {
        orderNumber,
        createdAt: new Date().toISOString(),
        items: bagItems.map((i) => ({ ...i })),
        subtotal,
        shipping,
        tax,
        total,
        recipientName: details.recipientName,
        city: details.city,
        deliveryTier: details.deliveryTier,
      };

      setOrders((prev) => [record, ...prev]);
      setBagItems([]);
      return record;
    },
    [bagItems]
  );

  const value = useMemo<AtelierContextValue>(
    () => ({
      activeScreen,
      activeShoeId,
      workingConfig,
      selectedZone,
      selectedSizeUS,
      wishlistIds,
      savedEditions,
      bagItems,
      orders,
      isBagOpen,
      toastMessage,
      navigateTo,
      setActiveShoe,
      setSelectedZone,
      updateZoneConfig,
      resetWorkingConfig,
      setSelectedSizeUS,
      toggleWishlist,
      saveCurrentEdition,
      loadEdition,
      deleteEdition,
      addToBag,
      updateBagQty,
      removeFromBag,
      setIsBagOpen,
      placeOrder,
      showToast,
    }),
    [
      activeScreen,
      activeShoeId,
      workingConfig,
      selectedZone,
      selectedSizeUS,
      wishlistIds,
      savedEditions,
      bagItems,
      orders,
      isBagOpen,
      toastMessage,
      navigateTo,
      setActiveShoe,
      updateZoneConfig,
      resetWorkingConfig,
      toggleWishlist,
      saveCurrentEdition,
      loadEdition,
      deleteEdition,
      addToBag,
      updateBagQty,
      removeFromBag,
      placeOrder,
      showToast,
    ]
  );

  return <AtelierContext.Provider value={value}>{children}</AtelierContext.Provider>;
};

export function useAtelier(): AtelierContextValue {
  const ctx = useContext(AtelierContext);
  if (!ctx) {
    throw new Error('useAtelier must be used inside AtelierProvider');
  }
  return ctx;
}
