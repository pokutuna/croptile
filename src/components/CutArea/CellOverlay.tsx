import type { Cell } from "../../types";

interface CellOverlayProps {
  cells: Cell[];
  placedCellRects: Set<string>;
  scale: number;
  onCellClick: (cellId: string) => void;
}

export function CellOverlay({
  cells,
  placedCellRects,
  scale,
  onCellClick,
}: CellOverlayProps) {
  return (
    <div className="absolute top-0 left-0 pointer-events-none">
      {cells.map((cell) => {
        const rectKey = `${cell.rect.x},${cell.rect.y},${cell.rect.width},${cell.rect.height}`;
        const isPlaced = placedCellRects.has(rectKey);
        return (
          <div
            key={cell.id}
            className="absolute pointer-events-none"
            style={{
              left: cell.rect.x * scale,
              top: cell.rect.y * scale,
              width: cell.rect.width * scale,
              height: cell.rect.height * scale,
              backgroundColor: isPlaced
                ? "rgba(59, 130, 246, 0.2)"
                : "transparent",
              border: isPlaced ? "2px solid rgba(59, 130, 246, 0.5)" : "none",
            }}
          >
            <button
              className="absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
              style={{
                backgroundColor: isPlaced
                  ? "rgba(59, 130, 246, 0.9)"
                  : "rgba(0, 0, 0, 0.6)",
                color: "white",
                border: "none",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onCellClick(cell.id);
              }}
              title="クリックでレイアウトに追加"
            >
              {cell.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
