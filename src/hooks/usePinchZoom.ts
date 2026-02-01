import { useEffect, useCallback } from "react";
import type { RefObject } from "react";

interface UsePinchZoomOptions {
  containerRef: RefObject<HTMLElement | null>;
  scale: number;
  setScale: (scale: number) => void;
  minScale: number;
  maxScale: number;
  step?: number;
}

export function usePinchZoom({
  containerRef,
  scale,
  setScale,
  minScale,
  maxScale,
  step = 0.02,
}: UsePinchZoomOptions) {
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Mac trackpad pinch gesture is detected as wheel event with ctrlKey=true
      if (!e.ctrlKey) return;

      e.preventDefault();

      // deltaY is negative for pinch out (zoom in), positive for pinch in (zoom out)
      const delta = -e.deltaY * step;
      const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));
      setScale(newScale);
    },
    [scale, setScale, minScale, maxScale, step],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false to allow preventDefault()
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef, handleWheel]);
}
