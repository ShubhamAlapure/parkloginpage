import React, { useState, useEffect } from 'react';

const HINT_ITEMS = [
  ['drag', 'Drag', 'look around'],
  ['scroll', 'Scroll', 'zoom'],
  ['keys', 'W A S D', 'move'],
  ['click', 'Click', 'follow someone'],
] as const;

const KEY_SET = new Set(['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

export const ViewControlsHUD: React.FC = () => {
  const [activeHints, setActiveHints] = useState<{ [key: string]: boolean }>({});
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const activeKeys = new Set<string>();
    const timeouts: { [key: string]: number } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const key = e.key.toLowerCase();
      if (KEY_SET.has(key)) {
        activeKeys.add(key);
        setActiveHints((prev) => ({ ...prev, keys: true }));
        setHasInteracted(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key.toLowerCase());
      if (activeKeys.size === 0) {
        setActiveHints((prev) => ({ ...prev, keys: false }));
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.closest('#auth-card')) return;
      setActiveHints((prev) => ({ ...prev, scroll: true }));
      setHasInteracted(true);
      clearTimeout(timeouts.scroll);
      timeouts.scroll = window.setTimeout(() => {
        setActiveHints((prev) => ({ ...prev, scroll: false }));
      }, 500);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest('#auth-card')) return;
      setActiveHints((prev) => ({ ...prev, drag: true }));
      setHasInteracted(true);
    };

    const handlePointerUp = () => {
      setActiveHints((prev) => (prev.drag ? { ...prev, drag: false } : prev));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  const handleReset = () => {
    if (typeof (window as any).__resetParkCamera === 'function') {
      (window as any).__resetParkCamera();
    }
  };

  const handleZoom = (factor: number) => {
    if (typeof (window as any).__zoomParkCamera === 'function') {
      (window as any).__zoomParkCamera(factor);
    }
  };

  return (
    <>
      {/* Navigation hints pill */}
      <div
        className="park-panel-module__olcSJq__hints"
        data-ready="true"
        data-quiet={hasInteracted ? 'true' : undefined}
      >
        {HINT_ITEMS.map(([id, label, action]) => (
          <span
            key={id}
            className="park-panel-module__olcSJq__hint"
            data-active={Boolean(activeHints[id]) ? 'true' : undefined}
          >
            <kbd>{label}</kbd>
            {action}
          </span>
        ))}
      </div>

      {/* Camera zoom / reset controls */}
      <div className="park-panel-module__olcSJq__controls" data-ready="true">
        <button
          type="button"
          onClick={() => handleZoom(0.2)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleZoom(-0.2)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset view"
          title="Reset view (R)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 2.3-5.6" />
            <path d="M4 4v4h4" />
          </svg>
        </button>
      </div>
    </>
  );
};
