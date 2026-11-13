import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Crosshair,
  RotateCw,
  ShoppingBag,
  SlidersHorizontal,
  Video,
  VideoOff,
} from 'lucide-react';
import { useAtelier } from '../context/AtelierContext';
import { AR_HARDWOOD_BACKDROP, SHOE_CATALOG, SIZE_CHART } from '../data/catalog';
import { ShoeViewport3D, type ShoeViewport3DHandle } from './ShoeViewport3D';
import { StudioImage } from './StudioImage';

type ArBackdropMode = 'hardwood' | 'concrete' | 'studio' | 'camera';

export const ARViewportScreen: React.FC = () => {
  const {
    activeShoeId,
    workingConfig,
    selectedSizeUS,
    setSelectedSizeUS,
    addToBag,
    showToast,
  } = useAtelier();

  const viewportRef = useRef<ShoeViewport3DHandle | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [backdropMode, setBackdropMode] = useState<ArBackdropMode>('hardwood');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arLocked, setArLocked] = useState(false);
  const [showPair, setShowPair] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(26);
  const [reticlePos, setReticlePos] = useState({ x: 50, y: 58 });
  const [arOffset, setArOffset] = useState({ x: 0, z: 0 });
  const [showControls, setShowControls] = useState(true);

  const activeShoe = useMemo(
    () => SHOE_CATALOG.find((s) => s.id === activeShoeId) ?? SHOE_CATALOG[0],
    [activeShoeId]
  );

  const activeSizeSpec = useMemo(
    () => SIZE_CHART.find((s) => s.us === selectedSizeUS) ?? SIZE_CHART[3],
    [selectedSizeUS]
  );

  // Proportional true-to-size scale relative to US 10 (280mm baseline)
  const scaleMultiplier = useMemo(() => {
    return Number((activeSizeSpec.mmLength / 280).toFixed(3));
  }, [activeSizeSpec]);

  // Live camera lifecycle when switching into/out of 'camera' mode
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      if (backdropMode !== 'camera') {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setCameraError(null);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Live camera API unavailable in this browser. Showing studio floor.');
        setBackdropMode('hardwood');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch {
        setCameraError('Camera permission declined. Switched back to Simulated Hardwood Studio.');
        setBackdropMode('hardwood');
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [backdropMode]);

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (arLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = Math.min(78, Math.max(22, ((e.clientX - rect.left) / rect.width) * 100));
    const py = Math.min(74, Math.max(36, ((e.clientY - rect.top) / rect.height) * 100));
    setReticlePos({ x: px, y: py });
    setArOffset({
      x: ((px - 50) / 50) * 0.45,
      z: ((py - 58) / 40) * 0.4,
    });
  };

  const handleToggleLock = () => {
    setArLocked((prev) => {
      const next = !prev;
      showToast(next ? 'Spatial floor anchor locked' : 'Scanning floor plane');
      return next;
    });
  };

  const handleCaptureSnapshot = () => {
    const dataUrl = viewportRef.current?.captureCanvasDataUrl();
    if (!dataUrl) {
      showToast('Snapshot ready');
      return;
    }
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${activeShoe.id}-ar-tryon.png`;
    link.click();
    showToast('Captured AR Try-On snapshot');
  };

  return (
    <main className="relative w-full h-[calc(100vh-52px)] md:h-[calc(100vh-64px)] overflow-hidden bg-[#18181b] select-none">
      {/* Layer 1: Simulated Room Environment OR Live Camera Feed */}
      <div className="absolute inset-0 z-0">
        {backdropMode === 'hardwood' && (
          <StudioImage
            src={AR_HARDWOOD_BACKDROP}
            alt="Minimalist oak hardwood studio floor for AR try-on"
            className="w-full h-full object-cover"
          />
        )}

        {backdropMode === 'concrete' && (
          <div
            className="w-full h-full"
            style={{
              background:
                'radial-gradient(circle at 50% 35%, #d6d3ce 0%, #b8b5af 48%, #8f8c86 100%)',
            }}
          >
            <div
              className="w-full h-full opacity-25"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(20,20,20,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,20,20,0.2) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                transform: 'perspective(600px) rotateX(55deg) scale(1.6)',
                transformOrigin: 'center 70%',
              }}
            />
          </div>
        )}

        {backdropMode === 'studio' && (
          <div
            className="w-full h-full"
            style={{
              background:
                'radial-gradient(circle at 50% 40%, #2e2e34 0%, #19191d 60%, #101012 100%)',
            }}
          />
        )}

        {backdropMode === 'camera' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Layer 2: Foot Detection Reticle & Spatial Caliper Overlay */}
      <div
        onPointerMove={handleStagePointerMove}
        onClick={() => {
          if (!arLocked) setArLocked(true);
        }}
        className="absolute inset-0 z-10 pointer-events-auto"
      >
        {/* Dynamic Reticle */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-150"
          style={{
            left: `${reticlePos.x}%`,
            top: `${reticlePos.y}%`,
          }}
        >
          <div
            className={`w-48 h-28 md:w-64 md:h-36 rounded-full border-[1.5px] flex items-center justify-center transition-colors duration-200 ${
              arLocked
                ? 'border-[#a3e635] bg-[#a3e635]/5'
                : 'border-[#2563eb]/80 bg-[#2563eb]/5'
            }`}
            style={{ transform: 'perspective(500px) rotateX(58deg)' }}
          >
            <div
              className={`w-20 h-20 rounded-full border border-dashed ${
                arLocked ? 'border-[#a3e635]/70' : 'border-[#2563eb]/60'
              }`}
            />
          </div>

          {/* Spatial Calipers Metric Tag */}
          <div className="mt-2 flex justify-center">
            <div className="px-3 py-1 rounded-full bg-[#141414]/85 border border-white/20 text-[10px] font-mono tabular-nums uppercase tracking-[0.12em] text-white whitespace-nowrap flex items-center gap-2">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  arLocked ? 'bg-[#a3e635]' : 'bg-[#2563eb]'
                }`}
              />
              <span>
                {arLocked ? 'Anchor Locked' : 'Scanning Plane'} · {activeSizeSpec.mmLength}mm ×{' '}
                {activeSizeSpec.mmWidth}mm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 3: Transparent Three.js 3D Shoe Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        <ShoeViewport3D
          ref={viewportRef}
          mode="ar"
          config={workingConfig}
          showPair={showPair}
          scaleMultiplier={scaleMultiplier}
          arRotationDeg={rotationDeg}
          arOffset={arOffset}
          arLocked={arLocked}
        />
      </div>

      {/* Top HUD Header */}
      <div className="pointer-events-none absolute top-3 md:top-5 inset-x-3 md:inset-x-6 z-30 flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-auto bg-white/95 border border-[#e5e5e5] rounded-2xl px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#141414]">{activeShoe.name}</span>
            <span className="text-[11px] font-mono tabular-nums text-[#737373]">
              US {activeSizeSpec.us} · {activeSizeSpec.mmLength}mm
            </span>
          </div>
          <p className="text-[11px] text-[#737373] mt-0.5">
            {cameraError ??
              'Drag to orbit 3D shoe · Tap floor reticle to lock millimeter scale'}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleCaptureSnapshot}
            className="min-h-[42px] px-3.5 py-2 rounded-full bg-white/95 border border-[#e5e5e5] text-[#141414] text-xs font-semibold flex items-center gap-1.5 hover:border-[#141414] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>

          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            aria-label="Toggle AR controls"
            className="min-h-[42px] min-w-[42px] rounded-full bg-white/95 border border-[#e5e5e5] text-[#141414] flex items-center justify-center hover:border-[#141414] shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
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
            className="min-h-[42px] px-4 py-2 rounded-full bg-[#2563eb] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#141414] transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>

      {/* Bottom AR Control Dock */}
      {showControls && (
        <div className="pointer-events-none fixed md:absolute bottom-[64px] md:bottom-5 inset-x-0 z-30 flex justify-center px-3">
          <div className="pointer-events-auto w-full max-w-[900px] bg-white/95 border border-[#e5e5e5] rounded-2xl p-3.5 md:p-4 shadow-md space-y-3">
            {/* Environment + Anchor Lock Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'hardwood', label: 'Hardwood Floor' },
                    { id: 'concrete', label: 'Raw Concrete' },
                    { id: 'studio', label: 'Dark Studio' },
                    { id: 'camera', label: 'Live Camera' },
                  ] as { id: ArBackdropMode; label: string }[]
                ).map((env) => {
                  const active = backdropMode === env.id;
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setBackdropMode(env.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#141414] text-white'
                          : 'bg-[#f6f3f2] text-[#737373] hover:text-[#141414]'
                      }`}
                    >
                      {env.id === 'camera' &&
                        (active ? (
                          <Video className="w-3.5 h-3.5 text-[#a3e635]" />
                        ) : (
                          <VideoOff className="w-3.5 h-3.5" />
                        ))}
                      <span>{env.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleToggleLock}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  arLocked
                    ? 'bg-[#a3e635] text-[#141414]'
                    : 'bg-[#2563eb] text-white hover:bg-[#141414]'
                }`}
              >
                {arLocked ? <Check className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5" />}
                <span>{arLocked ? 'Anchor Locked' : 'Lock Floor Anchor'}</span>
              </button>
            </div>

            {/* Calibration Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373] whitespace-nowrap">
                  Calibrated Size
                </span>
                <select
                  aria-label="AR shoe size calibration"
                  value={selectedSizeUS}
                  onChange={(e) => setSelectedSizeUS(Number(e.target.value))}
                  className="min-h-[38px] px-3 rounded-full bg-[#f6f3f2] border border-[#e5e5e5] text-xs font-mono tabular-nums font-semibold text-[#141414] cursor-pointer"
                >
                  {SIZE_CHART.map((sz) => (
                    <option key={sz.us} value={sz.us}>
                      US {sz.us} ({sz.mmLength}mm)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2.5">
                <RotateCw className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                <label htmlFor="ar-rotation" className="text-xs text-[#737373] whitespace-nowrap">
                  Angle
                </label>
                <input
                  id="ar-rotation"
                  type="range"
                  min={-180}
                  max={180}
                  value={rotationDeg}
                  onChange={(e) => setRotationDeg(Number(e.target.value))}
                  className="flex-1 accent-[#2563eb] cursor-pointer"
                />
                <span className="font-mono tabular-nums text-xs text-[#141414] w-10 text-right">
                  {rotationDeg}°
                </span>
              </div>

              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPair(false)}
                  className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    !showPair
                      ? 'bg-[#141414] text-white'
                      : 'bg-[#f6f3f2] text-[#737373] hover:text-[#141414]'
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setShowPair(true)}
                  className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    showPair
                      ? 'bg-[#141414] text-white'
                      : 'bg-[#f6f3f2] text-[#737373] hover:text-[#141414]'
                  }`}
                >
                  Pair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
