import { useState } from "react";
import type { Cell, LabelPosition } from "../../types";
import { t } from "../../i18n";
import { getLabelPositionStyle } from "../../utils/label";

interface CellOverlayProps {
  cells: Cell[];
  placedCellRects: Set<string>;
  scale: number;
  labelPosition: LabelPosition;
  onCellClick: (cellId: string) => void;
}

export function CellOverlay({
  cells,
  placedCellRects,
  scale,
  labelPosition,
  onCellClick,
}: CellOverlayProps) {
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);

  return (
    <div className="absolute top-0 left-0 pointer-events-none">
      {cells.map((cell) => {
        const rectKey = `${cell.rect.x},${cell.rect.y},${cell.rect.width},${cell.rect.height}`;
        const isPlaced = placedCellRects.has(rectKey);
        const isHovered = hoveredCellId === cell.id;
        return (
          <div
            key={cell.id}
            className="absolute pointer-events-auto"
            style={{
              left: cell.rect.x * scale,
              top: cell.rect.y * scale,
              width: cell.rect.width * scale,
              height: cell.rect.height * scale,
              backgroundColor: isPlaced
                ? "rgba(59, 130, 246, 0.2)"
                : isHovered
                  ? "rgba(59, 130, 246, 0.1)"
                  : "transparent",
              border: isPlaced
                ? "2px solid rgba(59, 130, 246, 0.5)"
                : isHovered
                  ? "2px dashed rgba(59, 130, 246, 0.5)"
                  : "none",
            }}
            onMouseEnter={() => setHoveredCellId(cell.id)}
            onMouseLeave={() => setHoveredCellId(null)}
          >
            <button
              className="absolute text-xs font-bold px-1.5 py-0.5 rounded pointer-events-auto cursor-pointer transition-all"
              style={{
                ...getLabelPositionStyle(labelPosition),
                backgroundColor: isHovered
                  ? "rgba(34, 197, 94, 0.9)"
                  : isPlaced
                    ? "rgba(59, 130, 246, 0.9)"
                    : "rgba(0, 0, 0, 0.6)",
                color: "white",
                border: "none",
                ...(labelPosition !== "center" && {
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                }),
              }}
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(cell.id);
              }}
              title={t("clickToAddCell")}
            >
              {isHovered ? t("addCell") : cell.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
