import heroAtelierImg from '../assets/images/hero_atelier_runner_1794550281838.jpg';
import shoeMonolithImg from '../assets/images/shoe_monolith_v1_1794550280973.jpg';
import shoeAeroCobaltImg from '../assets/images/shoe_aero_cobalt_1794550281312.jpg';
import shoeAtelierSuedeImg from '../assets/images/shoe_atelier_suede_1794550282182.jpg';
import shoeCarbonApexImg from '../assets/images/shoe_carbon_apex_1794550284780.jpg';
import arHardwoodImg from '../assets/images/ar_hardwood_studio_1794550283600.jpg';

import type {
  ColorSwatchOption,
  MaterialFinishOption,
  ShoeModel,
  ShoeZoneId,
  SizeOption,
} from '../types/footwear';

export const HERO_ASSET = heroAtelierImg;
export const AR_HARDWOOD_BACKDROP = arHardwoodImg;

export const SHOE_ZONES: { id: ShoeZoneId; label: string; partHint: string }[] = [
  { id: 'vamp', label: 'Vamp', partHint: 'Forefoot & Quarter Chassis' },
  { id: 'swoop', label: 'Swoop', partHint: 'Lateral Vector & Heel Clip' },
  { id: 'outsole', label: 'Outsole', partHint: 'Midsole & Sculpted Tread' },
  { id: 'laces', label: 'Laces', partHint: 'Technical Cord & Aglets' },
  { id: 'lining', label: 'Lining', partHint: 'Collar Cushion & Tongue' },
];

export const MATERIAL_FINISHES: MaterialFinishOption[] = [
  {
    id: 'tumbled-leather',
    label: 'Tumbled Leather',
    shortDesc: 'Full-grain Italian calfskin with matte pebble grain',
    roughness: 0.54,
    metalness: 0.04,
    clearcoat: 0.08,
    sheen: 0.15,
  },
  {
    id: 'ripstop-nylon',
    label: 'Ripstop Nylon',
    shortDesc: 'High-tenacity micro-grid technical weave',
    roughness: 0.42,
    metalness: 0.12,
    clearcoat: 0.18,
    sheen: 0.35,
  },
  {
    id: 'brushed-suede',
    label: 'Brushed Suede',
    shortDesc: 'Velvety split calf suede with directional nap',
    roughness: 0.88,
    metalness: 0.0,
    clearcoat: 0.0,
    sheen: 0.65,
  },
  {
    id: 'carbon-weave',
    label: 'Carbon Weave',
    shortDesc: '2x2 forged twill composite structural laminate',
    roughness: 0.28,
    metalness: 0.48,
    clearcoat: 0.65,
    sheen: 0.1,
  },
  {
    id: 'ice-rubber',
    label: 'Translucent Ice',
    shortDesc: 'Frosted elastomer outsole compound with sub-surface glow',
    roughness: 0.24,
    metalness: 0.05,
    clearcoat: 0.45,
    sheen: 0.0,
    transmission: 0.38,
  },
];

export const STUDIO_COLORS: ColorSwatchOption[] = [
  { name: 'Chalk Bone', hex: '#EDEAE4' },
  { name: 'Pure Studio', hex: '#F9F9F7' },
  { name: 'Obsidian Ink', hex: '#18181B' },
  { name: 'Electric Cobalt', hex: '#2563EB' },
  { name: 'Warm Sand', hex: '#CBB89D' },
  { name: 'Titanium Slate', hex: '#71717A' },
  { name: 'Gum Amber', hex: '#A57548' },
  { name: 'Volt Signal', hex: '#A3E635' },
  { name: 'Deep Alpine', hex: '#1F3A32' },
  { name: 'Oxide Clay', hex: '#9A3412' },
];

export const SIZE_CHART: SizeOption[] = [
  { us: 7, eu: 40, mmLength: 250, mmWidth: 94 },
  { us: 8, eu: 41, mmLength: 260, mmWidth: 97 },
  { us: 9, eu: 42.5, mmLength: 270, mmWidth: 100 },
  { us: 10, eu: 44, mmLength: 280, mmWidth: 103 },
  { us: 11, eu: 45, mmLength: 290, mmWidth: 106 },
  { us: 12, eu: 46, mmLength: 298, mmWidth: 108 },
  { us: 13, eu: 47.5, mmLength: 306, mmWidth: 111 },
];

export const SHOE_CATALOG: ShoeModel[] = [
  {
    id: 'monolith-v1',
    name: 'Monolith V1 Atelier',
    collection: 'Series 01 · Milan Studio',
    category: 'Architectural',
    basePrice: 480,
    bespokeSurcharge: 65,
    editionNote: 'Flagship Silhouette',
    image: shoeMonolithImg,
    description:
      'Sculpted around an anatomical last with full-grain tumbled leather, an articulated heel stabilizer, and a dual-density Pebax chassis.',
    specs: {
      weightGrams: 285,
      dropMm: 8,
      upperMaterial: 'Tumbled Calfskin',
      soleCompound: 'Dual-Density EVA',
    },
    defaultConfig: {
      vamp: { material: 'tumbled-leather', color: '#EDEAE4', colorName: 'Chalk Bone' },
      swoop: { material: 'carbon-weave', color: '#18181B', colorName: 'Obsidian Ink' },
      outsole: { material: 'tumbled-leather', color: '#F9F9F7', colorName: 'Pure Studio' },
      laces: { material: 'ripstop-nylon', color: '#EDEAE4', colorName: 'Chalk Bone' },
      lining: { material: 'brushed-suede', color: '#D4CFC7', colorName: 'Warm Stone' },
    },
  },
  {
    id: 'aero-cobalt',
    name: 'Aero Vector Cobalt',
    collection: 'Series 02 · Spatial Lab',
    category: 'Runners',
    basePrice: 520,
    bespokeSurcharge: 65,
    editionNote: 'Spatial Edition',
    image: shoeAeroCobaltImg,
    description:
      'Engineered with high-tenacity ripstop nylon quarters, a high-contrast electric cobalt lateral vector, and a frosted translucent outsole.',
    specs: {
      weightGrams: 262,
      dropMm: 9,
      upperMaterial: 'Technical Ripstop',
      soleCompound: 'Translucent Ice',
    },
    defaultConfig: {
      vamp: { material: 'ripstop-nylon', color: '#D4D4D8', colorName: 'Titanium Mist' },
      swoop: { material: 'tumbled-leather', color: '#2563EB', colorName: 'Electric Cobalt' },
      outsole: { material: 'ice-rubber', color: '#DCE7F7', colorName: 'Glacier Ice' },
      laces: { material: 'ripstop-nylon', color: '#3F3F46', colorName: 'Graphite' },
      lining: { material: 'ripstop-nylon', color: '#71717A', colorName: 'Titanium Slate' },
    },
  },
  {
    id: 'atelier-suede',
    name: 'Corsa Low Sand',
    collection: 'Series 01 · Heritage',
    category: 'Architectural',
    basePrice: 445,
    bespokeSurcharge: 65,
    image: shoeAtelierSuedeImg,
    description:
      'Unstructured Italian split suede upper paired with waxed cotton flat laces and a natural raw-crepe rubber cupsole.',
    specs: {
      weightGrams: 310,
      dropMm: 6,
      upperMaterial: 'Brushed Suede',
      soleCompound: 'Natural Gum',
    },
    defaultConfig: {
      vamp: { material: 'brushed-suede', color: '#CBB89D', colorName: 'Warm Sand' },
      swoop: { material: 'brushed-suede', color: '#B8A283', colorName: 'Oat Suede' },
      outsole: { material: 'tumbled-leather', color: '#A57548', colorName: 'Gum Amber' },
      laces: { material: 'ripstop-nylon', color: '#F9F9F7', colorName: 'Pure Studio' },
      lining: { material: 'tumbled-leather', color: '#D6B89C', colorName: 'Vachetta Tan' },
    },
  },
  {
    id: 'carbon-apex',
    name: 'Apex Carbon 04',
    collection: 'Series 03 · Limited Run',
    category: 'Limited Run',
    basePrice: 640,
    bespokeSurcharge: 80,
    editionNote: 'Numbered · 250 Pairs',
    image: shoeCarbonApexImg,
    description:
      'Forged 2x2 carbon twill midfoot panels locked onto an obsidian nubuck vamp with a high-visibility Volt heel stabilizer clip.',
    specs: {
      weightGrams: 248,
      dropMm: 10,
      upperMaterial: 'Carbon & Nubuck',
      soleCompound: 'Nitrogen Foam',
    },
    defaultConfig: {
      vamp: { material: 'brushed-suede', color: '#18181B', colorName: 'Obsidian Ink' },
      swoop: { material: 'carbon-weave', color: '#A3E635', colorName: 'Volt Signal' },
      outsole: { material: 'tumbled-leather', color: '#18181B', colorName: 'Obsidian Ink' },
      laces: { material: 'ripstop-nylon', color: '#27272A', colorName: 'Matte Black' },
      lining: { material: 'ripstop-nylon', color: '#18181B', colorName: 'Obsidian Ink' },
    },
  },
];
