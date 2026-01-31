import { useEffect, useRef, memo } from "react";
import type { Cell } from "../../types";

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
  onMouseDown: (e: React.MouseEvent, placedCellId: string) => void;
  onRemove: (id: string) => void;
}

export const PlacedCellView = memo(function PlacedCellView({
  placed,
  scale,
  isSelected,
  onMouseDown,
  onRemove,
}: PlacedCellViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <div
      className={`absolute cursor-move select-none ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
      }`}
      style={{
        left: placed.x * scale,
        top: placed.y * scale,
        width: placed.cell.rect.width * scale,
        height: placed.cell.rect.height * scale,
      }}
      onMouseDown={(e) => onMouseDown(e, placed.id)}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: placed.cell.rect.width * scale,
          height: placed.cell.rect.height * scale,
        }}
      />
      <button
        className="absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(placed.id);
        }}
        title="クリックで削除"
      >
        {placed.cell.label} ×
      </button>
    </div>
  );
});
