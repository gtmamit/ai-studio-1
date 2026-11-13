import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ShoeConfig, ShoeZoneId } from '../types/footwear';
import {
  createContactShadowTexture,
  createProceduralFinishTextures,
  type FinishTextureSet,
} from '../three/proceduralTextures';
import {
  applyShoeExplode,
  buildProceduralShoe,
  updateZoneMaterial,
  type ProceduralShoeRig,
} from '../three/shoeBuilder';

export type StudioLightingPreset = 'daylight' | 'warm' | 'contrast';

export interface ShoeViewport3DHandle {
  resetCamera: () => void;
  captureCanvasDataUrl: () => string | null;
}

interface ShoeViewport3DProps {
  mode: 'studio' | 'ar';
  config: ShoeConfig;
  selectedZone?: ShoeZoneId;
  onSelectZone?: (zone: ShoeZoneId) => void;
  exploded?: boolean;
  lightingPreset?: StudioLightingPreset;
  // AR props
  showPair?: boolean;
  scaleMultiplier?: number;
  arRotationDeg?: number;
  arOffset?: { x: number; z: number };
  arLocked?: boolean;
}

const ZONE_CAMERA_PRESETS: Record<ShoeZoneId, { pos: [number, number, number]; target: [number, number, number] }> = {
  vamp: { pos: [1.85, 1.05, 1.85], target: [0.22, 0.34, 0] },
  swoop: { pos: [-0.95, 0.9, 2.35], target: [-0.25, 0.38, 0] },
  outsole: { pos: [0.4, 0.32, 2.45], target: [0.0, 0.14, 0] },
  laces: { pos: [0.85, 1.75, 1.45], target: [0.1, 0.56, 0] },
  lining: { pos: [-1.45, 1.55, 1.35], target: [-0.45, 0.56, 0] },
};

const DEFAULT_STUDIO_CAM = { pos: [1.55, 1.05, 2.25] as [number, number, number], target: [0.0, 0.34, 0] as [number, number, number] };

function detectSoftwareWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const ShoeViewport3D = React.forwardRef<ShoeViewport3DHandle, ShoeViewport3DProps>(
  (
    {
      mode,
      config,
      selectedZone = 'vamp',
      onSelectZone,
      exploded = false,
      lightingPreset = 'daylight',
      showPair = false,
      scaleMultiplier = 1,
      arRotationDeg = 28,
      arOffset = { x: 0, z: 0 },
      arLocked = false,
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    const onSelectZoneRef = useRef(onSelectZone);
    onSelectZoneRef.current = onSelectZone;

    const latestConfigRef = useRef(config);
    latestConfigRef.current = config;

    const latestStateRef = useRef({
      mode,
      exploded,
      lightingPreset,
      showPair,
      scaleMultiplier,
      arRotationDeg,
      arOffset,
      arLocked,
    });
    latestStateRef.current = {
      mode,
      exploded,
      lightingPreset,
      showPair,
      scaleMultiplier,
      arRotationDeg,
      arOffset,
      arLocked,
    };

    const sceneControllerRef = useRef<{
      requestRender: () => void;
      flyToPreset: (pos: [number, number, number], target: [number, number, number]) => void;
      applyConfigNow: (cfg: ShoeConfig) => void;
      applyLightingNow: (preset: StudioLightingPreset) => void;
      applyArTransformsNow: () => void;
      setExplodeTarget: (target: number) => void;
      capture: () => string | null;
    } | null>(null);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        sceneControllerRef.current?.flyToPreset(DEFAULT_STUDIO_CAM.pos, DEFAULT_STUDIO_CAM.target);
      },
      captureCanvasDataUrl: () => sceneControllerRef.current?.capture() ?? null,
    }));

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      const width = Math.max(container.clientWidth, 320);
      const height = Math.max(container.clientHeight, 320);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: mode === 'ar',
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (mode === 'ar') {
        renderer.setClearColor(0x000000, 0);
      } else {
        renderer.setClearColor(0xf4f2ef, 1);
      }

      const canvas = renderer.domElement;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.touchAction = 'none';
      container.innerHTML = '';
      container.appendChild(canvas);

      const scene = new THREE.Scene();
      if (mode === 'studio') {
        scene.background = new THREE.Color('#f4f2ef');
        scene.fog = new THREE.Fog('#f4f2ef', 7, 16);
      }

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envTarget.texture;
      pmremGenerator.dispose();

      const camera = new THREE.PerspectiveCamera(
        mode === 'ar' ? 42 : 36,
        width / height,
        0.1,
        50
      );
      if (mode === 'ar') {
        camera.position.set(0.35, 1.78, 2.55);
      } else {
        camera.position.set(...DEFAULT_STUDIO_CAM.pos);
      }

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.minDistance = mode === 'ar' ? 1.6 : 1.5;
      controls.maxDistance = mode === 'ar' ? 4.5 : 4.2;
      controls.maxPolarAngle = mode === 'ar' ? Math.PI * 0.44 : Math.PI * 0.485;
      controls.minPolarAngle = 0.12;
      if (mode === 'ar') {
        controls.target.set(0, 0.18, 0);
      } else {
        controls.target.set(...DEFAULT_STUDIO_CAM.target);
      }
      controls.update();

      // 3-Point Studio Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xeef4ff, 0xd9d2c9, 0.85);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
      keyLight.position.set(3.4, 5.2, 3.6);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 14;
      const d = 2.2;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.15);
      rimLight.position.set(-3.2, 2.8, -3.4);
      scene.add(rimLight);

      // Studio Grounding Disc & Shadow Receiver
      let studioPedestalGroup: THREE.Group | null = null;
      const contactShadowTex = createContactShadowTexture();
      const shadowPlaneMat = new THREE.MeshBasicMaterial({
        map: contactShadowTex,
        transparent: true,
        depthWrite: false,
        opacity: mode === 'ar' ? 0.55 : 0.45,
      });

      const primaryShadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 1.7),
        shadowPlaneMat
      );
      primaryShadowPlane.rotation.x = -Math.PI / 2;
      primaryShadowPlane.position.y = 0.004;

      const secondaryShadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 1.7),
        shadowPlaneMat
      );
      secondaryShadowPlane.rotation.x = -Math.PI / 2;
      secondaryShadowPlane.position.y = 0.004;
      secondaryShadowPlane.visible = false;

      if (mode === 'studio') {
        studioPedestalGroup = new THREE.Group();
        const floorPlane = new THREE.Mesh(
          new THREE.CircleGeometry(7, 48),
          new THREE.MeshStandardMaterial({
            color: '#f0ede9',
            roughness: 0.92,
            metalness: 0.0,
          })
        );
        floorPlane.rotation.x = -Math.PI / 2;
        floorPlane.receiveShadow = true;
        studioPedestalGroup.add(floorPlane);

        // Subtle architectural plinth ring
        const ringGeo = new THREE.RingGeometry(1.36, 1.385, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: '#dcd8d2',
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = 0.003;
        studioPedestalGroup.add(ringMesh);
        scene.add(studioPedestalGroup);
      }

      // Procedural Textures & Sneaker Rig(s)
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      const textures: Record<string, FinishTextureSet> = createProceduralFinishTextures(maxAniso);

      const arAssemblyGroup = new THREE.Group();
      scene.add(arAssemblyGroup);

      const primaryRig: ProceduralShoeRig = buildProceduralShoe(
        latestConfigRef.current,
        textures as any,
        isSoftwareGl
      );
      primaryRig.root.add(primaryShadowPlane);
      arAssemblyGroup.add(primaryRig.root);

      let secondaryRig: ProceduralShoeRig | null = null;
      if (mode === 'ar') {
        secondaryRig = buildProceduralShoe(
          latestConfigRef.current,
          textures as any,
          isSoftwareGl
        );
        // Mirror Z slightly to represent left/right pair foot
        secondaryRig.root.scale.z = -1;
        secondaryRig.root.position.set(-0.08, 0, -0.78);
        secondaryRig.root.visible = false;
        secondaryRig.root.add(secondaryShadowPlane);
        arAssemblyGroup.add(secondaryRig.root);
      }

      // Animation / Transition State
      let currentExplode = 0;
      let targetExplode = 0;
      let camFlightActive = false;
      const desiredCamPos = new THREE.Vector3().copy(camera.position);
      const desiredCamTarget = new THREE.Vector3().copy(controls.target);

      const cancelCamFlight = () => {
        camFlightActive = false;
      };
      controls.addEventListener('start', cancelCamFlight);

      // Coalesced render loop with Software-WebGL fence pacing
      let frameId = 0;
      let renderBusy = false;
      let renderDirty = false;
      let disposed = false;
      let lastTime = performance.now();

      function afterDraw(cb: () => void) {
        try {
          const gl = renderer.getContext() as WebGL2RenderingContext;
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) return;
            const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (status === gl.UNSIGNALED) {
              frameId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              frameId = window.setTimeout(cb, 80);
            }
          };
          frameId = window.setTimeout(poll, 5);
        } catch {
          frameId = window.setTimeout(cb, 80);
        }
      }

      function requestRender() {
        if (disposed) return;
        if (renderBusy) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        frameId = requestAnimationFrame((now) => {
          if (disposed) return;
          renderDirty = false;
          const dt = Math.min(0.08, Math.max(0.001, (now - lastTime) / 1000));
          lastTime = now;

          let needsFollowup = false;

          // Smooth exploded-layer damping
          if (Math.abs(currentExplode - targetExplode) > 0.002) {
            currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, 9, dt);
            applyShoeExplode(primaryRig, currentExplode);
            needsFollowup = true;
          } else if (currentExplode !== targetExplode) {
            currentExplode = targetExplode;
            applyShoeExplode(primaryRig, currentExplode);
          }

          // Smooth camera preset damping
          if (camFlightActive) {
            camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamPos.x, 7, dt);
            camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredCamPos.y, 7, dt);
            camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamPos.z, 7, dt);

            controls.target.x = THREE.MathUtils.damp(controls.target.x, desiredCamTarget.x, 7, dt);
            controls.target.y = THREE.MathUtils.damp(controls.target.y, desiredCamTarget.y, 7, dt);
            controls.target.z = THREE.MathUtils.damp(controls.target.z, desiredCamTarget.z, 7, dt);

            const dist =
              camera.position.distanceTo(desiredCamPos) +
              controls.target.distanceTo(desiredCamTarget);
            if (dist < 0.015) {
              camFlightActive = false;
            } else {
              needsFollowup = true;
            }
          }

          const controlsChanged = controls.update();
          if (controlsChanged && controls.enableDamping) {
            needsFollowup = true;
          }

          renderer.render(scene, camera);

          const finish = () => {
            renderBusy = false;
            if (renderDirty || needsFollowup) {
              requestRender();
            }
          };
          if (isSoftwareGl) {
            afterDraw(finish);
          } else {
            finish();
          }
        });
      }

      controls.addEventListener('change', requestRender);

      // Raycasting on tap/click (ignoring orbit drags)
      const raycaster = new THREE.Raycaster();
      const pointerDownPos = { x: 0, y: 0 };
      const pointerNDC = new THREE.Vector2();

      const onPointerDown = (e: PointerEvent) => {
        pointerDownPos.x = e.clientX;
        pointerDownPos.y = e.clientY;
      };

      const onPointerUp = (e: PointerEvent) => {
        if (latestStateRef.current.mode !== 'studio' || !onSelectZoneRef.current) return;
        const dx = e.clientX - pointerDownPos.x;
        const dy = e.clientY - pointerDownPos.y;
        if (Math.hypot(dx, dy) > 6) return;

        const rect = canvas.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(primaryRig.root.children, false);
        if (hits.length > 0) {
          const hitZone = hits[0].object.userData.zone as ShoeZoneId | undefined;
          if (hitZone) {
            onSelectZoneRef.current(hitZone);
          }
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup', onPointerUp);

      // WebGL Context Lost / Restored Handlers
      const onContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const onContextRestored = () => {
        setContextLost(false);
        requestRender();
      };
      canvas.addEventListener('webglcontextlost', onContextLost);
      canvas.addEventListener('webglcontextrestored', onContextRestored);

      // Resize observer for fluid responsiveness
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(240, Math.floor(entry.contentRect.width));
        const h = Math.max(240, Math.floor(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender();
      });
      resizeObserver.observe(container);

      const applyConfigNow = (cfg: ShoeConfig) => {
        (['vamp', 'swoop', 'outsole', 'laces', 'lining'] as ShoeZoneId[]).forEach((z) => {
          updateZoneMaterial(primaryRig.zones[z].material, cfg[z], textures as any, isSoftwareGl);
          if (secondaryRig) {
            updateZoneMaterial(
              secondaryRig.zones[z].material,
              cfg[z],
              textures as any,
              isSoftwareGl
            );
          }
        });
        requestRender();
      };

      const applyLightingNow = (preset: StudioLightingPreset) => {
        if (preset === 'daylight') {
          if (mode === 'studio') {
            scene.background = new THREE.Color('#f4f2ef');
            scene.fog = new THREE.Fog('#f4f2ef', 7, 16);
          }
          keyLight.color.set('#fff7ed');
          keyLight.intensity = 2.2;
          hemiLight.intensity = 0.85;
          rimLight.intensity = 1.15;
          renderer.toneMappingExposure = 1.08;
        } else if (preset === 'warm') {
          if (mode === 'studio') {
            scene.background = new THREE.Color('#efeae3');
            scene.fog = new THREE.Fog('#efeae3', 7, 16);
          }
          keyLight.color.set('#ffe4c4');
          keyLight.intensity = 2.45;
          hemiLight.intensity = 0.72;
          rimLight.intensity = 0.9;
          renderer.toneMappingExposure = 1.12;
        } else {
          if (mode === 'studio') {
            scene.background = new THREE.Color('#1c1c1f');
            scene.fog = new THREE.Fog('#1c1c1f', 7, 16);
          }
          keyLight.color.set('#ffffff');
          keyLight.intensity = 2.6;
          hemiLight.intensity = 0.4;
          rimLight.intensity = 2.1;
          renderer.toneMappingExposure = 1.18;
        }
        requestRender();
      };

      const applyArTransformsNow = () => {
        const s = latestStateRef.current;
        if (s.mode !== 'ar') return;
        arAssemblyGroup.scale.setScalar(s.scaleMultiplier);
        arAssemblyGroup.rotation.y = THREE.MathUtils.degToRad(s.arRotationDeg);
        arAssemblyGroup.position.set(s.arOffset.x, 0, s.arOffset.z);

        if (secondaryRig) {
          secondaryRig.root.visible = s.showPair;
          secondaryShadowPlane.visible = s.showPair;
          primaryRig.root.position.set(s.showPair ? 0.08 : 0, 0, s.showPair ? 0.38 : 0);
          secondaryRig.root.position.set(s.showPair ? -0.08 : 0, 0, s.showPair ? -0.38 : 0);
        }
        requestRender();
      };

      sceneControllerRef.current = {
        requestRender,
        flyToPreset: (pos, target) => {
          desiredCamPos.set(...pos);
          desiredCamTarget.set(...target);
          camFlightActive = true;
          requestRender();
        },
        applyConfigNow,
        applyLightingNow,
        applyArTransformsNow,
        setExplodeTarget: (target) => {
          targetExplode = target;
          requestRender();
        },
        capture: () => {
          renderer.render(scene, camera);
          return canvas.toDataURL('image/png');
        },
      };

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      applyLightingNow(latestStateRef.current.lightingPreset);
      applyArTransformsNow();
      requestRender();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver.disconnect();
        controls.removeEventListener('start', cancelCamFlight);
        controls.removeEventListener('change', requestRender);
        controls.dispose();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);

        primaryRig.dispose();
        secondaryRig?.dispose();
        Object.values(textures).forEach((t) => {
          t.bumpMap.dispose();
          t.roughnessMap.dispose();
          t.colorDetailMap?.dispose();
        });
        contactShadowTex.dispose();
        shadowPlaneMat.dispose();
        primaryShadowPlane.geometry.dispose();
        secondaryShadowPlane.geometry.dispose();
        if (studioPedestalGroup) {
          studioPedestalGroup.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const m = obj as THREE.Mesh;
              m.geometry.dispose();
              (m.material as THREE.Material).dispose();
            }
          });
        }
        envTarget.dispose();
        renderer.dispose();
      };
    }, [mode]);

    // Sync config changes without tearing down WebGL
    useEffect(() => {
      sceneControllerRef.current?.applyConfigNow(config);
    }, [config]);

    // Sync camera preset when zone changes in Studio mode
    useEffect(() => {
      if (mode !== 'studio' || !selectedZone) return;
      const preset = ZONE_CAMERA_PRESETS[selectedZone];
      sceneControllerRef.current?.flyToPreset(preset.pos, preset.target);
    }, [mode, selectedZone]);

    // Sync exploded view
    useEffect(() => {
      if (mode !== 'studio') return;
      sceneControllerRef.current?.setExplodeTarget(exploded ? 1 : 0);
    }, [mode, exploded]);

    // Sync studio lighting preset
    useEffect(() => {
      sceneControllerRef.current?.applyLightingNow(lightingPreset);
    }, [lightingPreset]);

    // Sync AR transforms
    useEffect(() => {
      sceneControllerRef.current?.applyArTransformsNow();
    }, [mode, showPair, scaleMultiplier, arRotationDeg, arOffset, arLocked]);

    return (
      <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full" />
        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#f4f2ef] text-[#141414] p-6 text-center">
            <div>
              <p className="text-sm font-semibold">3D Studio Context Interrupted</p>
              <p className="text-xs text-[#737373] mt-1">
                Restoring WebGL rendering surface automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ShoeViewport3D.displayName = 'ShoeViewport3D';
