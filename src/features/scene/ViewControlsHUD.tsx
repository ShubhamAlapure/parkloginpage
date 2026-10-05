import React, { useState } from 'react';
import { Compass, RotateCcw, HelpCircle, Move, Eye } from 'lucide-react';

export const ViewControlsHUD: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  const handleReset = () => {
    if (typeof (window as any).__resetParkCamera === 'function') {
      (window as any).__resetParkCamera();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-2 pointer-events-none select-none">
      {/* Main 360 View Indicator & Reset Pill */}
      <div className="pointer-events-auto flex items-center gap-2 bg-park-cream/90 dark:bg-stone-900/90 backdrop-blur-md border border-park-forest/20 dark:border-amber-500/20 shadow-lg rounded-full px-3 py-1.5 text-xs font-sans text-park-forest dark:text-stone-200 transition-all duration-200">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Compass className="w-3.5 h-3.5 text-park-forest dark:text-amber-400" />
          <span>360° Free View</span>
        </div>

        <span className="text-park-forest/30 dark:text-stone-600">|</span>

        <button
          onClick={() => setShowHelp(!showHelp)}
          aria-label="View navigation instructions"
          className="flex items-center gap-1 text-park-forest/70 hover:text-park-forest dark:text-stone-400 dark:hover:text-stone-100 transition-colors p-1 rounded hover:bg-park-forest/10"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Controls</span>
        </button>

        <button
          onClick={handleReset}
          aria-label="Reset Camera View"
          className="flex items-center gap-1 bg-park-forest text-white dark:bg-amber-600 dark:hover:bg-amber-500 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm hover:bg-park-forest/90 transition-transform active:scale-95"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Expanded Interactive Control Instructions */}
      {showHelp && (
        <div className="pointer-events-auto w-72 bg-park-cream/95 dark:bg-stone-900/95 backdrop-blur-lg border border-park-forest/20 dark:border-amber-500/20 shadow-xl rounded-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-park-forest/10 dark:border-stone-700 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-park-forest dark:text-amber-400">
              <Move className="w-4 h-4" />
              <span>Camera Navigation Guide</span>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-stone-700 dark:text-stone-300">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">Orbit 360° View:</span>
              <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] border border-stone-200 dark:border-stone-700">Left Drag / Touch</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">Pan Park:</span>
              <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] border border-stone-200 dark:border-stone-700">Right Drag / 2-Finger</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">Zoom In/Out:</span>
              <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] border border-stone-200 dark:border-stone-700">Scroll / Pinch</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">Keyboard Move:</span>
              <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] border border-stone-200 dark:border-stone-700">WASD / Arrow Keys</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">Tilt Elevation:</span>
              <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[11px] border border-stone-200 dark:border-stone-700">Q / E Keys</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
