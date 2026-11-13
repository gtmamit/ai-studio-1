import * as THREE from 'three';
import type { MaterialFinishId } from '../types/footwear';

export interface FinishTextureSet {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  colorDetailMap?: THREE.CanvasTexture;
  bumpScale: number;
}

function makeSeededRand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function configureTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  isColor: boolean,
  anisotropy: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = Math.max(1, anisotropy);
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralFinishTextures(
  anisotropy: number
): Record<MaterialFinishId, FinishTextureSet> {
  const size = 256;

  // 1. Tumbled Leather: cellular pebble grain
  const leatherBump = document.createElement('canvas');
  leatherBump.width = size;
  leatherBump.height = size;
  const lCtx = leatherBump.getContext('2d')!;
  lCtx.fillStyle = '#909090';
  lCtx.fillRect(0, 0, size, size);
  const randL = makeSeededRand(4021);
  for (let i = 0; i < 950; i++) {
    const x = randL() * size;
    const y = randL() * size;
    const r = 3 + randL() * 5.5;
    const shade = Math.floor(155 + randL() * 75);
    const grad = lCtx.createRadialGradient(x, y, 0.5, x, y, r);
    grad.addColorStop(0, `rgb(${shade},${shade},${shade})`);
    grad.addColorStop(0.72, `rgb(${shade - 25},${shade - 25},${shade - 25})`);
    grad.addColorStop(1, 'rgba(90,90,90,0)');
    lCtx.fillStyle = grad;
    lCtx.beginPath();
    lCtx.arc(x, y, r, 0, Math.PI * 2);
    lCtx.fill();
  }

  // 2. Ripstop Nylon: tight micro-grid + thicker reinforcement threads
  const ripstopBump = document.createElement('canvas');
  ripstopBump.width = size;
  ripstopBump.height = size;
  const rCtx = ripstopBump.getContext('2d')!;
  rCtx.fillStyle = '#888888';
  rCtx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 4) {
    rCtx.fillStyle = y % 32 === 0 ? '#ebebeb' : '#a8a8a8';
    rCtx.fillRect(0, y, size, y % 32 === 0 ? 2 : 1);
  }
  for (let x = 0; x < size; x += 4) {
    rCtx.fillStyle = x % 32 === 0 ? '#f0f0f0' : '#9c9c9c';
    rCtx.fillRect(x, 0, x % 32 === 0 ? 2 : 1, size);
  }

  // 3. Brushed Suede: fine organic fibrous nap
  const suedeBump = document.createElement('canvas');
  suedeBump.width = size;
  suedeBump.height = size;
  const sCtx = suedeBump.getContext('2d')!;
  sCtx.fillStyle = '#808080';
  sCtx.fillRect(0, 0, size, size);
  const randS = makeSeededRand(8831);
  for (let i = 0; i < 4200; i++) {
    const x = randS() * size;
    const y = randS() * size;
    const len = 2 + randS() * 6;
    const ang = (randS() - 0.5) * 0.65;
    const v = Math.floor(85 + randS() * 145);
    sCtx.strokeStyle = `rgba(${v},${v},${v},0.45)`;
    sCtx.lineWidth = 1;
    sCtx.beginPath();
    sCtx.moveTo(x, y);
    sCtx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    sCtx.stroke();
  }

  // 4. Carbon Weave: diagonal 2x2 twill pattern (both bump & subtle tonal detail)
  const carbonBump = document.createElement('canvas');
  carbonBump.width = size;
  carbonBump.height = size;
  const cCtx = carbonBump.getContext('2d')!;
  const carbonColor = document.createElement('canvas');
  carbonColor.width = size;
  carbonColor.height = size;
  const ccCtx = carbonColor.getContext('2d')!;

  const cell = 16;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const diag = ((x / cell + y / cell) % 4 + 4) % 4;
      const isWarp = diag < 2;
      cCtx.fillStyle = isWarp ? '#d8d8d8' : '#707070';
      cCtx.fillRect(x, y, cell, cell);
      cCtx.fillStyle = isWarp ? '#f2f2f2' : '#555555';
      cCtx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

      ccCtx.fillStyle = isWarp ? '#ececec' : '#a6a6a6';
      ccCtx.fillRect(x, y, cell, cell);
      ccCtx.fillStyle = isWarp ? '#ffffff' : '#bcbcbc';
      ccCtx.fillRect(x + 1, y + 1, cell - 3, cell - 3);
    }
  }

  // 5. Ice Rubber: subtle molded micro-frosted grip texture
  const iceBump = document.createElement('canvas');
  iceBump.width = size;
  iceBump.height = size;
  const iCtx = iceBump.getContext('2d')!;
  iCtx.fillStyle = '#9a9a9a';
  iCtx.fillRect(0, 0, size, size);
  const randI = makeSeededRand(1973);
  for (let i = 0; i < 700; i++) {
    const x = randI() * size;
    const y = randI() * size;
    const v = Math.floor(130 + randI() * 60);
    iCtx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    iCtx.fillRect(x, y, 3, 3);
  }

  return {
    'tumbled-leather': {
      bumpMap: configureTexture(leatherBump, 4, 4, false, anisotropy),
      roughnessMap: configureTexture(leatherBump, 4, 4, false, anisotropy),
      bumpScale: 0.012,
    },
    'ripstop-nylon': {
      bumpMap: configureTexture(ripstopBump, 6, 6, false, anisotropy),
      roughnessMap: configureTexture(ripstopBump, 6, 6, false, anisotropy),
      bumpScale: 0.014,
    },
    'brushed-suede': {
      bumpMap: configureTexture(suedeBump, 5, 5, false, anisotropy),
      roughnessMap: configureTexture(suedeBump, 5, 5, false, anisotropy),
      bumpScale: 0.018,
    },
    'carbon-weave': {
      bumpMap: configureTexture(carbonBump, 4, 4, false, anisotropy),
      roughnessMap: configureTexture(carbonBump, 4, 4, false, anisotropy),
      colorDetailMap: configureTexture(carbonColor, 4, 4, true, anisotropy),
      bumpScale: 0.016,
    },
    'ice-rubber': {
      bumpMap: configureTexture(iceBump, 3, 3, false, anisotropy),
      roughnessMap: configureTexture(iceBump, 3, 3, false, anisotropy),
      bumpScale: 0.008,
    },
  };
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.06,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(15, 15, 20, 0.46)');
  grad.addColorStop(0.55, 'rgba(15, 15, 20, 0.18)');
  grad.addColorStop(1, 'rgba(15, 15, 20, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
