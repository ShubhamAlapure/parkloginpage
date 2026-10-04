import { useEffect } from 'react';
import { useAppStore, QualityTier } from '@/app/store';

export function useQualityTier() {
  const { qualityTier, setQualityTier } = useAppStore();

  useEffect(() => {
    // Basic heuristic: check hardware concurrency, mobile device, or low-power indicators
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4;

    if (isMobile || cores <= 2) {
      setQualityTier('low');
    } else if (cores <= 4) {
      setQualityTier('medium');
    } else {
      setQualityTier('high');
    }
  }, [setQualityTier]);

  return { qualityTier, setQualityTier };
}
