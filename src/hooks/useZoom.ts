import { useState, useCallback } from "react";
import type { RefObject } from "react";

interface UseZoomOptions {
  minScale?: number;
  maxScale?: number;
  step?: number;
  gutterSize?: number;
  padding?: number;
}

interface UseZoomReturn {
  scale: number;
  setScale: (scale: number) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  handleFitToView: (
    boundingBox: { width: number; height: number } | null,
    containerRef: RefObject<HTMLElement | null>,
  ) => void;
  handleFitToWidth: (
    width: number | null,
    containerRef: RefObject<HTMLElement | null>,
  ) => void;
  handleFitToHeight: (
    height: number | null,
    containerRef: RefObject<HTMLElement | null>,
  ) => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function useZoom(options: UseZoomOptions = {}): UseZoomReturn {
  const {
    minScale = 0.25,
    maxScale = 3,
    step = 0.25,
    gutterSize = 20,
    padding = 20,
  } = options;

  const [scale, setScale] = useState(1);

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(maxScale, s + step));
  }, [maxScale, step]);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(minScale, s - step));
  }, [minScale, step]);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const handleFitToView = useCallback(
    (
      boundingBox: { width: number; height: number } | null,
      containerRef: RefObject<HTMLElement | null>,
    ) => {
      if (!boundingBox || !containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth - gutterSize - padding;
      const containerHeight = container.clientHeight - gutterSize - padding;
      const scaleX = containerWidth / boundingBox.width;
      const scaleY = containerHeight / boundingBox.height;
      const fitScale = Math.min(scaleX, scaleY, maxScale);
      setScale(Math.max(minScale, fitScale));
    },
    [gutterSize, padding, maxScale, minScale],
  );

  const handleFitToWidth = useCallback(
    (width: number | null, containerRef: RefObject<HTMLElement | null>) => {
      if (!width || !containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth - gutterSize - padding;
      const fitScale = Math.min(containerWidth / width, maxScale);
      setScale(Math.max(minScale, fitScale));
    },
    [gutterSize, padding, maxScale, minScale],
  );

  const handleFitToHeight = useCallback(
    (height: number | null, containerRef: RefObject<HTMLElement | null>) => {
      if (!height || !containerRef.current) return;
      const container = containerRef.current;
      const containerHeight = container.clientHeight - gutterSize - padding;
      const fitScale = Math.min(containerHeight / height, maxScale);
      setScale(Math.max(minScale, fitScale));
    },
    [gutterSize, padding, maxScale, minScale],
  );

  return {
    scale,
    setScale,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFitToView,
    handleFitToWidth,
    handleFitToHeight,
    canZoomIn: scale < maxScale,
    canZoomOut: scale > minScale,
  };
}
