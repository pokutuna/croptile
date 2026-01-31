import { useState } from "react";
import { X } from "lucide-react";
import type { HorizontalLine, VerticalLine, CutMode } from "../../types";
import { t } from "../../i18n";

interface LineOverlayProps {
  horizontalLines: HorizontalLine[];
  verticalLines: VerticalLine[];
  scale: number;
  imageWidth: number;
  imageHeight: number;
  mousePos: { x: number; y: number } | null;
  cutMode: CutMode;
  previewCellBounds: {
    leftX: number;
    topY: number;
    rightX: number;
    bottomY: number;
  } | null;
  gutterPreview: { type: "left" | "top"; position: number } | null;
  onLineMouseDown: (type: "horizontal" | "vertical", id: string) => void;
  onLineDelete: (type: "horizontal" | "vertical", id: string) => void;
}

export function LineOverlay({
  horizontalLines,
  verticalLines,
  scale,
  imageWidth,
  imageHeight,
  mousePos,
  cutMode,
  previewCellBounds,
  gutterPreview,
  onLineMouseDown,
  onLineDelete,
}: LineOverlayProps) {
  const [hoveredLine, setHoveredLine] = useState<{
    type: "horizontal" | "vertical";
    id: string;
  } | null>(null);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: imageWidth * scale,
        height: imageHeight * scale,
      }}
    >
      <svg
        className="absolute top-0 left-0"
        style={{
          width: imageWidth * scale,
          height: imageHeight * scale,
        }}
      >
        {/* プレビュー線 */}
        {mousePos && cutMode === "horizontal" && previewCellBounds && (
          <line
            x1={previewCellBounds.leftX * scale}
            y1={mousePos.y * scale}
            x2={previewCellBounds.rightX * scale}
            y2={mousePos.y * scale}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
        {mousePos && cutMode === "vertical" && previewCellBounds && (
          <line
            x1={mousePos.x * scale}
            y1={previewCellBounds.topY * scale}
            x2={mousePos.x * scale}
            y2={previewCellBounds.bottomY * scale}
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}

        {/* ガタープレビュー線（一直線） */}
        {gutterPreview?.type === "left" && (
          <line
            x1={0}
            y1={gutterPreview.position * scale}
            x2={imageWidth * scale}
            y2={gutterPreview.position * scale}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
        {gutterPreview?.type === "top" && (
          <line
            x1={gutterPreview.position * scale}
            y1={0}
            x2={gutterPreview.position * scale}
            y2={imageHeight * scale}
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}

        {/* 確定した横線 */}
        {horizontalLines.map((line) => (
          <g key={line.id}>
            {/* 当たり判定用の透明な太い線 */}
            <line
              x1={line.leftBoundX * scale}
              y1={line.y * scale}
              x2={line.rightBoundX * scale}
              y2={line.y * scale}
              stroke="transparent"
              strokeWidth={12}
              className="pointer-events-auto cursor-row-resize"
              onMouseEnter={() =>
                setHoveredLine({ type: "horizontal", id: line.id })
              }
              onMouseLeave={() => setHoveredLine(null)}
              onMouseDown={(e) => {
                e.stopPropagation();
                onLineMouseDown("horizontal", line.id);
              }}
            />
            {/* 実際に表示される線 */}
            <line
              x1={line.leftBoundX * scale}
              y1={line.y * scale}
              x2={line.rightBoundX * scale}
              y2={line.y * scale}
              stroke="#3b82f6"
              strokeWidth={3}
              pointerEvents="none"
            />
          </g>
        ))}

        {/* 確定した縦線 */}
        {verticalLines.map((line) => (
          <g key={line.id}>
            {/* 当たり判定用の透明な太い線 */}
            <line
              x1={line.x * scale}
              y1={line.topBoundY * scale}
              x2={line.x * scale}
              y2={line.bottomBoundY * scale}
              stroke="transparent"
              strokeWidth={12}
              className="pointer-events-auto cursor-col-resize"
              onMouseEnter={() =>
                setHoveredLine({ type: "vertical", id: line.id })
              }
              onMouseLeave={() => setHoveredLine(null)}
              onMouseDown={(e) => {
                e.stopPropagation();
                onLineMouseDown("vertical", line.id);
              }}
            />
            {/* 実際に表示される線 */}
            <line
              x1={line.x * scale}
              y1={line.topBoundY * scale}
              x2={line.x * scale}
              y2={line.bottomBoundY * scale}
              stroke="#10b981"
              strokeWidth={3}
              pointerEvents="none"
            />
          </g>
        ))}
      </svg>

      {/* 削除ボタン - 横線 */}
      {horizontalLines.map((line) => {
        const isHovered =
          hoveredLine?.type === "horizontal" && hoveredLine?.id === line.id;
        if (!isHovered) return null;
        return (
          <button
            key={`del-h-${line.id}`}
            className="absolute pointer-events-auto bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md"
            style={{
              left: line.leftBoundX * scale + 8,
              top: line.y * scale - 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onLineDelete("horizontal", line.id);
            }}
            onMouseEnter={() =>
              setHoveredLine({ type: "horizontal", id: line.id })
            }
            title={t("delete")}
          >
            <X size={14} />
          </button>
        );
      })}

      {/* 削除ボタン - 縦線 */}
      {verticalLines.map((line) => {
        const isHovered =
          hoveredLine?.type === "vertical" && hoveredLine?.id === line.id;
        if (!isHovered) return null;
        return (
          <button
            key={`del-v-${line.id}`}
            className="absolute pointer-events-auto bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md"
            style={{
              left: line.x * scale - 10,
              top: line.topBoundY * scale + 8,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onLineDelete("vertical", line.id);
            }}
            onMouseEnter={() =>
              setHoveredLine({ type: "vertical", id: line.id })
            }
            title={t("delete")}
          >
            <X size={14} />
          </button>
        );
      })}
    </div>
  );
}
