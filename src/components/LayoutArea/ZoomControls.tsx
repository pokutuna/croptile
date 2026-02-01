import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";
import { EditableZoomValue } from "./EditableZoomValue";

interface ZoomControlsProps {
  scale: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  canFit: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToView: () => void;
  onFitToWidth: () => void;
  onFitToHeight: () => void;
  onScaleChange?: (scale: number) => void;
  minScale?: number;
  maxScale?: number;
}

export function ZoomControls({
  scale,
  canZoomIn,
  canZoomOut,
  canFit,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToView,
  onFitToWidth,
  onFitToHeight,
  onScaleChange,
  minScale = 0.25,
  maxScale = 3,
}: ZoomControlsProps) {
  useLocale();

  return (
    <>
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t("zoomOut")}
      >
        <ZoomOut size={18} />
      </button>
      {onScaleChange ? (
        <EditableZoomValue
          scale={scale}
          onScaleChange={onScaleChange}
          minScale={minScale}
          maxScale={maxScale}
        />
      ) : (
        <span className="text-sm font-medium w-16 text-center">
          {Math.round(scale * 100)}%
        </span>
      )}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t("zoomIn")}
      >
        <ZoomIn size={18} />
      </button>
      <button
        onClick={onResetZoom}
        className="p-1 rounded hover:bg-gray-300 ml-2"
        title={t("resetZoom")}
      >
        <RotateCcw size={18} />
      </button>
      <button
        onClick={onFitToView}
        disabled={!canFit}
        className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t("fitToView")}
      >
        <Maximize size={18} />
      </button>
      <button
        onClick={onFitToWidth}
        disabled={!canFit}
        className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t("fitToWidth")}
      >
        <MoveHorizontal size={18} />
      </button>
      <button
        onClick={onFitToHeight}
        disabled={!canFit}
        className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t("fitToHeight")}
      >
        <MoveVertical size={18} />
      </button>
    </>
  );
}
