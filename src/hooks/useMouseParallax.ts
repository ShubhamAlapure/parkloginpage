import { useEffect } from 'react';
import { useAppStore } from '@/app/store';

export function useMouseParallax() {
  const setMousePos = useAppStore((s) => s.setMousePos);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setMousePos({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Normalized between -1 and 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [setMousePos, reducedMotion]);
}
