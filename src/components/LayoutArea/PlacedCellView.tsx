import { useEffect, useRef, memo, useState, useCallback } from "react";
import type { Cell, LabelPosition, PaintStroke } from "../../types";
import { t } from "../../i18n";
import { getLabelPositionStyle } from "../../utils/label";

interface PlacedCellInfo {
  id: string;
  cellId: string;
  x: number;
  y: number;
  cell: Cell;
  image: { dataUrl: string };
}

interface PlacedCellViewProps {
  placed: PlacedCellInfo;
  scale: number;
  isSelected: boolean;
  paintMode: boolean;
  paintStrokes: PaintStroke[];
  paintColor: string;
  paintWidth: number;
  labelPosition: LabelPosition;
  onMouseDown: (e: React.MouseEvent, placedCellId: string) => void;
  onPaintStart: (
    e: React.MouseEvent,
    placedCellId: string,
    cellX: number,
    cellY: number,
  ) => void;
  onRemove: (id: string) => void;
}

// ポイント配列からSVGパスを生成
function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  return (
    `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ")
  );
}

export const PlacedCellView = memo(function PlacedCellView({
  placed,
  scale,
  isSelected,
  paintMode,
  paintStrokes,
  paintColor,
  paintWidth,
  labelPosition,
  onMouseDown,
  onPaintStart,
  onRemove,
}: PlacedCellViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isLabelHovered, setIsLabelHovered] = useState(false);

  // 画像の描画は cellId と image が変わった時のみ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = placed.cell.rect.width;
    canvas.height = placed.cell.rect.height;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(
        img,
        placed.cell.rect.x,
        placed.cell.rect.y,
        placed.cell.rect.width,
        placed.cell.rect.height,
        0,
        0,
        placed.cell.rect.width,
        placed.cell.rect.height,
      );
    };
    img.src = placed.image.dataUrl;
  }, [placed.cellId, placed.image.dataUrl, placed.cell.rect]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (paintMode) {
      // ペンモード: 描画開始
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      onPaintStart(e, placed.id, x, y);
    } else {
      // 通常モード: ドラッグ開始
      onMouseDown(e, placed.id);
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!paintMode) {
        setCursorPos(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setCursorPos({ x, y });
    },
    [paintMode, scale],
  );

  const handleMouseLeave = useCallback(() => {
    setCursorPos(null);
  }, []);

  return (
    <div
      className={`absolute select-none layout-canvas-area ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
      }`}
      style={{
        left: placed.x * scale,
        top: placed.y * scale,
        width: placed.cell.rect.width * scale,
        height: placed.cell.rect.height * scale,
        cursor: paintMode ? "none" : "move",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: placed.cell.rect.width * scale,
          height: placed.cell.rect.height * scale,
        }}
      />

      {/* ペンストロークのSVGオーバーレイ */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={placed.cell.rect.width * scale}
        height={placed.cell.rect.height * scale}
        viewBox={`0 0 ${placed.cell.rect.width} ${placed.cell.rect.height}`}
        preserveAspectRatio="none"
      >
        {/* 確定済みストローク */}
        {paintStrokes.map((stroke) => (
          <path
            key={stroke.id}
            d={pointsToPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}

        {/* ペンサイズプレビュー（カーソル位置に半透明の円 + 青い外周線） */}
        {paintMode && cursorPos && (
          <circle
            cx={cursorPos.x}
            cy={cursorPos.y}
            r={paintWidth / 2}
            fill={paintColor}
            fillOpacity={0.5}
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeOpacity={0.7}
          />
        )}
      </svg>

      <button
        className="absolute text-xs font-bold px-1.5 py-0.5 rounded text-white transition-all"
        style={{
          ...getLabelPositionStyle(labelPosition),
          backgroundColor: isLabelHovered
            ? "rgba(239, 68, 68, 0.9)"
            : "rgba(59, 130, 246, 0.9)",
          ...(labelPosition !== "center" && {
            transform: isLabelHovered ? "scale(1.1)" : "scale(1)",
          }),
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(placed.id);
        }}
        onMouseEnter={() => setIsLabelHovered(true)}
        onMouseLeave={() => setIsLabelHovered(false)}
        title={t("clickToDelete")}
      >
        {isLabelHovered ? t("delete") : placed.cell.label}
      </button>
    </div>
  );
});
