import * as THREE from 'three';
import { MATERIAL_FINISHES } from '../data/catalog';
import type { MaterialFinishId, ShoeConfig, ShoeZoneId, ZoneConfig } from '../types/footwear';
import { type FinishTextureSet } from './proceduralTextures';

export interface ZonePartGroup {
  zone: ShoeZoneId;
  meshes: THREE.Mesh[];
  basePositions: THREE.Vector3[];
  explodeOffset: THREE.Vector3;
  material: THREE.MeshPhysicalMaterial;
}

export interface ProceduralShoeRig {
  root: THREE.Group;
  zones: Record<ShoeZoneId, ZonePartGroup>;
  hardwareMaterial: THREE.MeshStandardMaterial;
  dispose: () => void;
}

/**
 * Generates an anatomical sneaker footprint silhouette along X (-1.06 heel -> +1.14 toe)
 * with slight medial/lateral asymmetry in Z.
 */
function halfWidthAt(u: number, isLateral: boolean): number {
  // u in [0, 1] from heel (0) to toe (1)
  // Heel cup width ~0.27, arch narrows slightly ~0.24, ball widens ~0.39, toe tapers smoothly
  const heel = 0.27 * Math.exp(-Math.pow((u - 0.14) / 0.18, 2));
  const ball = 0.37 * Math.exp(-Math.pow((u - 0.68) / 0.27, 2));
  const arch = 0.21 * Math.exp(-Math.pow((u - 0.42) / 0.22, 2));
  const raw = Math.max(heel, ball, arch);
  const endTaper =
    Math.sin(Math.pow(Math.min(1, Math.max(0, u)), 0.72) * Math.PI) * 0.28 + 0.72;
  const asymmetric = isLateral ? 1.07 : 0.93;
  // Clean elliptical caps at heel and toe
  const cap =
    u < 0.08
      ? Math.sqrt(Math.max(0.02, u / 0.08))
      : u > 0.88
      ? Math.sqrt(Math.max(0.01, (1 - u) / 0.12))
      : 1;
  return raw * endTaper * asymmetric * cap;
}

function createSoleShape(scaleXZ = 1): THREE.Shape {
  const shape = new THREE.Shape();
  const samples = 44;
  const pts: THREE.Vector2[] = [];

  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = THREE.MathUtils.lerp(-1.06, 1.14, u) * scaleXZ;
    const z = halfWidthAt(u, true) * scaleXZ;
    pts.push(new THREE.Vector2(x, z));
  }
  for (let i = samples; i >= 0; i--) {
    const u = i / samples;
    const x = THREE.MathUtils.lerp(-1.06, 1.14, u) * scaleXZ;
    const z = -halfWidthAt(u, false) * scaleXZ;
    pts.push(new THREE.Vector2(x, z));
  }

  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i].x, pts[i].y);
  }
  shape.closePath();
  return shape;
}

/**
 * Builds a continuous sculpted sneaker upper shell using an anatomical cross-section loft
 * so the toebox, vamp, quarter panels, and heel cup read immediately as a luxury sneaker.
 */
function buildSculptedUpperGeometry(): THREE.BufferGeometry {
  const uSteps = 44; // heel (0) -> toe (1)
  const vSteps = 28; // lateral sole edge (0) -> top ridge (0.5) -> medial sole edge (1)

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iu = 0; iu <= uSteps; iu++) {
    const u = iu / uSteps;
    const x = THREE.MathUtils.lerp(-1.02, 1.1, u);

    // Height profile of the upper ridge from heel tab down to toe tip
    let topY = 0.25;
    if (u < 0.15) {
      // Heel collar height
      topY = THREE.MathUtils.lerp(0.68, 0.72, u / 0.15);
    } else if (u < 0.34) {
      // Ankle cutout dip
      const t = (u - 0.15) / 0.19;
      topY = THREE.MathUtils.lerp(0.72, 0.56, Math.sin(t * Math.PI * 0.5));
    } else if (u < 0.62) {
      // Instep / throat slope down toward vamp
      const t = (u - 0.34) / 0.28;
      topY = THREE.MathUtils.lerp(0.56, 0.42, t);
    } else if (u < 0.88) {
      // Vamp / toebox curve
      const t = (u - 0.62) / 0.26;
      topY = THREE.MathUtils.lerp(0.42, 0.28, Math.pow(t, 1.3));
    } else {
      // Toe tip drop into sole
      const t = (u - 0.88) / 0.12;
      topY = THREE.MathUtils.lerp(0.28, 0.18, t);
    }

    // Subtle toe spring lifting the base edge slightly near the toe
    const baseY = u > 0.75 ? 0.2 + Math.pow((u - 0.75) / 0.25, 2) * 0.065 : 0.2;

    const wLat = halfWidthAt(u, true) * 0.98;
    const wMed = halfWidthAt(u, false) * 0.98;

    for (let iv = 0; iv <= vSteps; iv++) {
      const v = iv / vSteps;
      // theta goes from 0 (lateral bottom) -> PI/2 (top center) -> PI (medial bottom)
      const theta = v * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const width = cosT >= 0 ? wLat : wMed;
      // Slight inward pinch near collar opening on heel/midfoot
      const collarPinch = u < 0.55 ? 1 - 0.22 * Math.pow(sinT, 2) : 1 - 0.08 * Math.pow(sinT, 2);

      const z = cosT * width * collarPinch;
      // Smooth rounded dome profile
      const y = baseY + Math.pow(sinT, 0.78) * (topY - baseY);

      positions.push(x, y, z);
      uvs.push(u * 2.2, v);
    }
  }

  const rowLen = vSteps + 1;
  for (let iu = 0; iu < uSteps; iu++) {
    for (let iv = 0; iv < vSteps; iv++) {
      const a = iu * rowLen + iv;
      const b = (iu + 1) * rowLen + iv;
      const c = (iu + 1) * rowLen + (iv + 1);
      const d = iu * rowLen + (iv + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createMaterialForZone(
  zoneCfg: ZoneConfig,
  textures: Record<MaterialFinishId, FinishTextureSet>,
  isSoftwareGl: boolean
): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(zoneCfg.color),
  });
  updateZoneMaterial(mat, zoneCfg, textures, isSoftwareGl);
  return mat;
}

export function updateZoneMaterial(
  mat: THREE.MeshPhysicalMaterial,
  zoneCfg: ZoneConfig,
  textures: Record<MaterialFinishId, FinishTextureSet>,
  isSoftwareGl: boolean
) {
  const spec =
    MATERIAL_FINISHES.find((m) => m.id === zoneCfg.material) ?? MATERIAL_FINISHES[0];
  const texSet = textures[zoneCfg.material] ?? textures['tumbled-leather'];

  mat.color.set(zoneCfg.color);
  mat.roughness = spec.roughness;
  mat.metalness = spec.metalness;
  mat.clearcoat = spec.clearcoat;
  mat.clearcoatRoughness = Math.max(0.08, spec.roughness * 0.45);
  mat.sheen = spec.sheen;
  mat.sheenRoughness = 0.6;
  mat.sheenColor.set(zoneCfg.color).lerp(new THREE.Color('#ffffff'), 0.35);

  if (spec.transmission && spec.transmission > 0) {
    if (isSoftwareGl) {
      mat.transmission = 0;
      mat.transparent = true;
      mat.opacity = 0.72;
    } else {
      mat.transmission = spec.transmission;
      mat.transparent = true;
      mat.opacity = 0.94;
      mat.ior = 1.48;
      mat.thickness = 0.35;
    }
  } else {
    mat.transmission = 0;
    mat.transparent = false;
    mat.opacity = 1;
  }

  mat.bumpMap = texSet.bumpMap;
  mat.bumpScale = texSet.bumpScale;
  mat.roughnessMap = texSet.roughnessMap;
  mat.map = texSet.colorDetailMap ?? null;
  mat.needsUpdate = true;
}

export function buildProceduralShoe(
  initialConfig: ShoeConfig,
  textures: Record<MaterialFinishId, FinishTextureSet>,
  isSoftwareGl: boolean
): ProceduralShoeRig {
  const root = new THREE.Group();
  root.name = 'AtelierShoeRoot';

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];

  const registerGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };

  const materials: Record<ShoeZoneId, THREE.MeshPhysicalMaterial> = {
    vamp: createMaterialForZone(initialConfig.vamp, textures, isSoftwareGl),
    swoop: createMaterialForZone(initialConfig.swoop, textures, isSoftwareGl),
    outsole: createMaterialForZone(initialConfig.outsole, textures, isSoftwareGl),
    laces: createMaterialForZone(initialConfig.laces, textures, isSoftwareGl),
    lining: createMaterialForZone(initialConfig.lining, textures, isSoftwareGl),
  };

  Object.values(materials).forEach((m) => materialsToDispose.push(m));

  const hardwareMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.88,
    roughness: 0.22,
  });
  materialsToDispose.push(hardwareMaterial);

  const zoneMeshes: Record<ShoeZoneId, THREE.Mesh[]> = {
    vamp: [],
    swoop: [],
    outsole: [],
    laces: [],
    lining: [],
  };

  const tagMesh = (mesh: THREE.Mesh, zone: ShoeZoneId) => {
    mesh.userData.zone = zone;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    zoneMeshes[zone].push(mesh);
    return mesh;
  };

  // --- 1. OUTSOLE & SCULPTED MIDSOLE (outsole zone) ---
  const outsoleShape = createSoleShape(1.03);
  const treadGeo = registerGeo(
    new THREE.ExtrudeGeometry(outsoleShape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 24,
    })
  );
  treadGeo.rotateX(Math.PI / 2);
  const treadMesh = tagMesh(new THREE.Mesh(treadGeo, materials.outsole), 'outsole');
  treadMesh.position.set(0, 0.07, 0);
  root.add(treadMesh);

  const midsoleShape = createSoleShape(1.0);
  const midsoleGeo = registerGeo(
    new THREE.ExtrudeGeometry(midsoleShape, {
      depth: 0.145,
      bevelEnabled: true,
      bevelThickness: 0.032,
      bevelSize: 0.025,
      bevelSegments: 4,
      curveSegments: 24,
    })
  );
  midsoleGeo.rotateX(Math.PI / 2);
  const midsoleMesh = tagMesh(new THREE.Mesh(midsoleGeo, materials.outsole), 'outsole');
  midsoleMesh.position.set(0, 0.22, 0);
  root.add(midsoleMesh);

  // Subtle sculpted outsole tread lugs along bottom
  const lugPositions = [-0.82, -0.58, 0.25, 0.48, 0.72, 0.94];
  lugPositions.forEach((lx) => {
    const u = (lx + 1.06) / 2.2;
    const width = (halfWidthAt(u, true) + halfWidthAt(u, false)) * 0.86;
    const lugGeo = registerGeo(new THREE.BoxGeometry(0.11, 0.024, width));
    const lug = tagMesh(new THREE.Mesh(lugGeo, materials.outsole), 'outsole');
    lug.position.set(lx, 0.012, 0);
    root.add(lug);
  });

  // --- 2. SCULPTED UPPER VAMP & QUARTER CHASSIS (vamp zone) ---
  const upperGeo = registerGeo(buildSculptedUpperGeometry());
  const upperMesh = tagMesh(new THREE.Mesh(upperGeo, materials.vamp), 'vamp');
  root.add(upperMesh);

  // Mudguard / toe rand overlay
  const randShape = createSoleShape(0.99);
  const randGeo = registerGeo(
    new THREE.ExtrudeGeometry(randShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    })
  );
  randGeo.rotateX(Math.PI / 2);
  const randMesh = tagMesh(new THREE.Mesh(randGeo, materials.vamp), 'vamp');
  randMesh.position.set(0, 0.255, 0);
  root.add(randMesh);

  // --- 3. LATERAL & MEDIAL SWOOP + HEEL STABILIZER (swoop zone) ---
  const createSwoopRibbon = (sideSign: 1 | -1) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.32, 0.28, sideSign * 0.34),
      new THREE.Vector3(-0.08, 0.37, sideSign * 0.3),
      new THREE.Vector3(-0.54, 0.44, sideSign * 0.28),
      new THREE.Vector3(-0.96, 0.5, sideSign * 0.14),
    ]);
    const tube = registerGeo(new THREE.TubeGeometry(curve, 32, 0.028, 12, false));
    tube.scale(1, 1.45, 0.45);
    const mesh = tagMesh(new THREE.Mesh(tube, materials.swoop), 'swoop');
    return mesh;
  };
  root.add(createSwoopRibbon(1));
  root.add(createSwoopRibbon(-1));

  // Architectural U-shaped heel stabilizer clip
  const heelArcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.66, 0.26, 0.29),
    new THREE.Vector3(-0.96, 0.33, 0.23),
    new THREE.Vector3(-1.07, 0.42, 0.0),
    new THREE.Vector3(-0.96, 0.33, -0.23),
    new THREE.Vector3(-0.66, 0.26, -0.29),
  ]);
  const heelClipGeo = registerGeo(new THREE.TubeGeometry(heelArcCurve, 32, 0.044, 14, false));
  heelClipGeo.scale(1, 1.55, 1);
  const heelClipMesh = tagMesh(new THREE.Mesh(heelClipGeo, materials.swoop), 'swoop');
  root.add(heelClipMesh);

  // --- 4. PADDED COLLAR, TONGUE & LINING (lining zone) ---
  const collarCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.96, 0.66, 0.0),
      new THREE.Vector3(-0.76, 0.61, 0.21),
      new THREE.Vector3(-0.36, 0.56, 0.19),
      new THREE.Vector3(-0.18, 0.61, 0.0),
      new THREE.Vector3(-0.36, 0.56, -0.19),
      new THREE.Vector3(-0.76, 0.61, -0.21),
    ],
    true
  );
  const collarGeo = registerGeo(new THREE.TubeGeometry(collarCurve, 44, 0.068, 14, true));
  const collarMesh = tagMesh(new THREE.Mesh(collarGeo, materials.lining), 'lining');
  root.add(collarMesh);

  // Sculpted padded tongue
  const tongueCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.32, 0.42, 0),
    new THREE.Vector3(0.08, 0.57, 0),
    new THREE.Vector3(-0.14, 0.72, 0),
    new THREE.Vector3(-0.24, 0.79, 0),
  ]);
  const tongueGeo = registerGeo(new THREE.TubeGeometry(tongueCurve, 24, 0.125, 12, false));
  tongueGeo.scale(1, 0.38, 1.15);
  const tongueMesh = tagMesh(new THREE.Mesh(tongueGeo, materials.lining), 'lining');
  tongueMesh.position.set(0, 0.26, 0);
  root.add(tongueMesh);

  // Interior footbed insert
  const footbedShape = createSoleShape(0.76);
  const footbedGeo = registerGeo(
    new THREE.ExtrudeGeometry(footbedShape, { depth: 0.03, bevelEnabled: false })
  );
  footbedGeo.rotateX(Math.PI / 2);
  const footbedMesh = tagMesh(new THREE.Mesh(footbedGeo, materials.lining), 'lining');
  footbedMesh.position.set(-0.08, 0.31, 0);
  root.add(footbedMesh);

  // --- 5. WOVEN LACES & BRUSHED HARDWARE EYELETS (laces zone) ---
  const eyeletGeo = registerGeo(new THREE.TorusGeometry(0.02, 0.006, 8, 16));
  const laceRows = 5;
  for (let i = 0; i < laceRows; i++) {
    const t = i / (laceRows - 1);
    const x = THREE.MathUtils.lerp(0.36, -0.04, t);
    const y = THREE.MathUtils.lerp(0.45, 0.62, t);
    const zSpan = THREE.MathUtils.lerp(0.15, 0.17, t);

    // Eyelets on lateral and medial eyestay
    const leftEye = new THREE.Mesh(eyeletGeo, hardwareMaterial);
    leftEye.position.set(x, y, zSpan + 0.015);
    leftEye.rotation.x = Math.PI / 2.6;
    leftEye.userData.zone = 'laces';
    root.add(leftEye);

    const rightEye = new THREE.Mesh(eyeletGeo, hardwareMaterial);
    rightEye.position.set(x, y, -zSpan - 0.015);
    rightEye.rotation.x = -Math.PI / 2.6;
    rightEye.userData.zone = 'laces';
    root.add(rightEye);

    // Criss-cross lace cord
    const xNext = i < laceRows - 1 ? THREE.MathUtils.lerp(0.36, -0.04, (i + 1) / (laceRows - 1)) : x - 0.04;
    const yNext = i < laceRows - 1 ? THREE.MathUtils.lerp(0.45, 0.62, (i + 1) / (laceRows - 1)) : y + 0.03;

    const strandA = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, y, zSpan),
      new THREE.Vector3((x + xNext) * 0.5, (y + yNext) * 0.5 + 0.025, 0),
      new THREE.Vector3(xNext, yNext, -zSpan),
    ]);
    const strandB = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, y, -zSpan),
      new THREE.Vector3((x + xNext) * 0.5, (y + yNext) * 0.5 + 0.016, 0),
      new THREE.Vector3(xNext, yNext, zSpan),
    ]);

    const strandAGeo = registerGeo(new THREE.TubeGeometry(strandA, 14, 0.013, 8, false));
    const strandBGeo = registerGeo(new THREE.TubeGeometry(strandB, 14, 0.013, 8, false));
    root.add(tagMesh(new THREE.Mesh(strandAGeo, materials.laces), 'laces'));
    root.add(tagMesh(new THREE.Mesh(strandBGeo, materials.laces), 'laces'));
  }

  // Top lace knot + twin loops
  const knotGeo = registerGeo(new THREE.SphereGeometry(0.026, 12, 12));
  const knotMesh = tagMesh(new THREE.Mesh(knotGeo, materials.laces), 'laces');
  knotMesh.position.set(-0.08, 0.66, 0);
  root.add(knotMesh);

  [-1, 1].forEach((side) => {
    const loopCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.66, 0),
      new THREE.Vector3(-0.16, 0.72, side * 0.08),
      new THREE.Vector3(-0.22, 0.65, side * 0.14),
      new THREE.Vector3(-0.11, 0.64, side * 0.04),
      new THREE.Vector3(-0.08, 0.66, 0),
    ]);
    const loopGeo = registerGeo(new THREE.TubeGeometry(loopCurve, 18, 0.011, 8, true));
    root.add(tagMesh(new THREE.Mesh(loopGeo, materials.laces), 'laces'));
  });

  const explodeVectors: Record<ShoeZoneId, THREE.Vector3> = {
    vamp: new THREE.Vector3(0, 0.02, 0),
    swoop: new THREE.Vector3(-0.08, 0.08, 0),
    outsole: new THREE.Vector3(0, -0.22, 0),
    laces: new THREE.Vector3(0.06, 0.26, 0),
    lining: new THREE.Vector3(-0.05, 0.18, 0),
  };

  const zones = {} as Record<ShoeZoneId, ZonePartGroup>;
  (['vamp', 'swoop', 'outsole', 'laces', 'lining'] as ShoeZoneId[]).forEach((z) => {
    zones[z] = {
      zone: z,
      meshes: zoneMeshes[z],
      basePositions: zoneMeshes[z].map((m) => m.position.clone()),
      explodeOffset: explodeVectors[z],
      material: materials[z],
    };
  });

  return {
    root,
    zones,
    hardwareMaterial,
    dispose: () => {
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
    },
  };
}

export function applyShoeExplode(rig: ProceduralShoeRig, factor: number) {
  (Object.keys(rig.zones) as ShoeZoneId[]).forEach((zoneKey) => {
    const group = rig.zones[zoneKey];
    group.meshes.forEach((mesh, idx) => {
      const base = group.basePositions[idx];
      // Lateral swoop ribbons push outward in Z symmetrically
      let zOffset = group.explodeOffset.z * factor;
      if (zoneKey === 'swoop' && idx < 2) {
        zOffset = (idx === 0 ? 0.18 : -0.18) * factor;
      }
      mesh.position.set(
        base.x + group.explodeOffset.x * factor,
        base.y + group.explodeOffset.y * factor,
        base.z + zOffset
      );
    });
  });
}
