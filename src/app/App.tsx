import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthPanel } from '@/features/auth/AuthPanel';
import { ParkScene } from '@/features/scene/Scene';

const HINTS = [
  ['drag', 'Drag', 'look around'],
  ['scroll', 'Scroll', 'zoom'],
  ['keys', 'W A S D', 'move'],
  ['click', 'Click', 'follow someone'],
] as const;

const KEY_SET = new Set(['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

export const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isQuiet, setIsQuiet] = useState(false);
  const [activeHints, setActiveHints] = useState<{ [k: string]: boolean }>({});
  const captionRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ zoom: (f: number) => void; reset: () => void } | null>(null);

  const onInteract = useCallback(() => setIsQuiet(true), []);

  useEffect(() => {
    const activeKeys = new Set<string>();
    const timeouts: Record<string, number> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const k = e.key.toLowerCase();
      if (KEY_SET.has(k)) {
        activeKeys.add(k);
        setActiveHints(prev => ({ ...prev, keys: true }));
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key.toLowerCase());
      if (!activeKeys.size) {
        setActiveHints(prev => ({ ...prev, keys: false }));
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof HTMLCanvasElement) {
        setActiveHints(prev => ({ ...prev, scroll: true }));
        clearTimeout(timeouts.scroll);
        timeouts.scroll = window.setTimeout(() => {
          setActiveHints(prev => ({ ...prev, scroll: false }));
        }, 500);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof HTMLCanvasElement) {
        setActiveHints(prev => ({ ...prev, drag: true }));
      }
    };

    const onPointerUp = () => {
      setActiveHints(prev => (prev.drag ? { ...prev, drag: false } : prev));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="page-module___8aEwW__shell">
      <div className="page-module___8aEwW__stage">
        <section
          className="park-panel-module__olcSJq__panel"
          aria-label="Interactive park. Drag or use W A S D and the arrow keys to look around; scroll or + and − to zoom; R to reset."
        >
          {/* Static Poster Backdrop */}
          <div className="park-panel-module__olcSJq__poster" data-hidden={isReady ? 'true' : undefined} aria-hidden="true" />

          {/* 3D WebGL Park Scene */}
          <div className="park-panel-module__olcSJq__scene" data-ready={isReady ? 'true' : undefined}>
            <ParkScene
              labelRef={captionRef}
              controlsRef={controlsRef}
              onInteract={onInteract}
              onReady={() => setTimeout(() => setIsReady(true), 400)}
            />
          </div>

          {/* Interactive Floating Hover / Follow Caption */}
          <div ref={captionRef} className="park-panel-module__olcSJq__caption" aria-hidden="true" />

          {/* Vignette Shade Overlay */}
          <div className="park-panel-module__olcSJq__shade" aria-hidden="true" />

          {/* HUD Keybinding Indicators */}
          <div className="park-panel-module__olcSJq__hints" data-quiet={isQuiet ? 'true' : undefined} data-ready={isReady ? 'true' : undefined}>
            {HINTS.map(([id, keyLabel, action]) => (
              <span key={id} className="park-panel-module__olcSJq__hint" data-active={activeHints[id] ? 'true' : undefined}>
                <kbd>{keyLabel}</kbd>
                {action}
              </span>
            ))}
          </div>

          {/* Bottom Right Controls: Zoom In, Zoom Out, Reset Camera */}
          <div className="park-panel-module__olcSJq__controls" data-ready={isReady ? 'true' : undefined}>
            <button type="button" onClick={() => controlsRef.current?.zoom(0.8)} aria-label="Zoom in">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button type="button" onClick={() => controlsRef.current?.zoom(1.25)} aria-label="Zoom out">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14" />
              </svg>
            </button>
            <button type="button" onClick={() => controlsRef.current?.reset()} aria-label="Reset view">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 1 0 2.3-5.6" />
                <path d="M4 4v4h4" />
              </svg>
            </button>
          </div>
        </section>
      </div>

      {/* Main Authentication Card */}
      <AuthPanel />
    </div>
  );
};

export default App;
