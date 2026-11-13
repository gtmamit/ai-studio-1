export type ScreenId = 'home' | 'customizer' | 'ar' | 'wishlist';

export type ShoeZoneId = 'vamp' | 'swoop' | 'outsole' | 'laces' | 'lining';

export type MaterialFinishId =
  | 'tumbled-leather'
  | 'ripstop-nylon'
  | 'brushed-suede'
  | 'carbon-weave'
  | 'ice-rubber';

export interface ZoneConfig {
  material: MaterialFinishId;
  color: string;
  colorName: string;
}

export type ShoeConfig = Record<ShoeZoneId, ZoneConfig>;

export type ShoeCategory = 'Runners' | 'Architectural' | 'Limited Run';

export interface ShoeModel {
  id: string;
  name: string;
  collection: string;
  category: ShoeCategory;
  basePrice: number;
  bespokeSurcharge: number;
  editionNote?: string;
  image: string;
  description: string;
  specs: {
    weightGrams: number;
    dropMm: number;
    upperMaterial: string;
    soleCompound: string;
  };
  defaultConfig: ShoeConfig;
}

export interface MaterialFinishOption {
  id: MaterialFinishId;
  label: string;
  shortDesc: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  sheen: number;
  transmission?: number;
}

export interface ColorSwatchOption {
  name: string;
  hex: string;
}

export interface SizeOption {
  us: number;
  eu: number;
  mmLength: number;
  mmWidth: number;
}

export interface BagItem {
  lineId: string;
  shoeId: string;
  name: string;
  image: string;
  sizeUS: number;
  quantity: number;
  unitPrice: number;
  isBespoke: boolean;
  configSnapshot: ShoeConfig;
}

export interface SavedEdition {
  editionId: string;
  shoeId: string;
  shoeName: string;
  title: string;
  createdAt: string;
  unitPrice: number;
  configSnapshot: ShoeConfig;
}

export interface OrderRecord {
  orderNumber: string;
  createdAt: string;
  items: BagItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  recipientName: string;
  city: string;
  deliveryTier: 'standard' | 'priority';
}
