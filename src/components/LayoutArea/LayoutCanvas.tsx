import { useCallback, useEffect, useState, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { calculateSnap } from "../../utils/snap";
import type { Cell } from "../../types";
import { PlacedCellView } from "./PlacedCellView";

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

interface DragState {
  placedCellId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export function LayoutCanvas() {
  const [scale, setScale] = useState(1);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [guideLines, setGuideLines] = useState<
    { type: "horizontal" | "vertical"; position: number }[]
  >([]);

  const images = useAppStore((state) => state.images);
  const cells = useAppStore((state) => state.cells);
  const placedCells = useAppStore((state) => state.placedCells);
  const selectedPlacedCellId = useAppStore(
    (state) => state.selectedPlacedCellId,
  );
  const useBackground = useAppStore((state) => state.useBackground);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const updatePlacedCellPosition = useAppStore(
    (state) => state.updatePlacedCellPosition,
  );
  const removePlacedCell = useAppStore((state) => state.removePlacedCell);
  const setSelectedPlacedCell = useAppStore(
    (state) => state.setSelectedPlacedCell,
  );

  // 拡大縮小
  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  // 配置されたセルの情報を取得
  const placedCellsWithInfo = useMemo(() => {
    return placedCells
      .map((pc) => {
        const cell = cells.find((c) => c.id === pc.cellId);
        const image = cell
          ? images.find((img) => img.id === cell.imageId)
          : null;
        if (!cell || !image) return null;
        return { ...pc, cell, image };
      })
      .filter(Boolean) as Array<{
      id: string;
      cellId: string;
      x: number;
      y: number;
      cell: Cell;
      image: { dataUrl: string };
    }>;
  }, [placedCells, cells, images]);

  // 配置されたセルのバウンディングボックスを計算
  const boundingBox = useMemo(() => {
    if (placedCellsWithInfo.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const placed of placedCellsWithInfo) {
      minX = Math.min(minX, placed.x);
      minY = Math.min(minY, placed.y);
      maxX = Math.max(maxX, placed.x + placed.cell.rect.width);
      maxY = Math.max(maxY, placed.y + placed.cell.rect.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [placedCellsWithInfo]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, placedCellId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const placed = placedCells.find((pc) => pc.id === placedCellId);
      if (!placed) return;

      setSelectedPlacedCell(placedCellId);
      setDragState({
        placedCellId,
        startX: placed.x,
        startY: placed.y,
        offsetX: e.clientX / scale - placed.x,
        offsetY: e.clientY / scale - placed.y,
      });
    },
    [placedCells, setSelectedPlacedCell, scale],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;

      const newX = e.clientX / scale - dragState.offsetX;
      const newY = e.clientY / scale - dragState.offsetY;

      const draggingPlaced = placedCellsWithInfo.find(
        (p) => p.id === dragState.placedCellId,
      );
      if (!draggingPlaced) return;

      // 他のセルの矩形を取得
      const otherRects = placedCellsWithInfo
        .filter((p) => p.id !== dragState.placedCellId)
        .map((p) => ({
          x: p.x,
          y: p.y,
          width: p.cell.rect.width,
          height: p.cell.rect.height,
        }));

      const movingRect = {
        x: newX,
        y: newY,
        width: draggingPlaced.cell.rect.width,
        height: draggingPlaced.cell.rect.height,
      };

      const snapResult = calculateSnap(movingRect, otherRects, newX, newY);
      setGuideLines(snapResult.guideLines);
      updatePlacedCellPosition(
        dragState.placedCellId,
        snapResult.x,
        snapResult.y,
      );
    },
    [dragState, placedCellsWithInfo, updatePlacedCellPosition, scale],
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setGuideLines([]);
  }, []);

  const handleContainerClick = useCallback(() => {
    setSelectedPlacedCell(null);
  }, [setSelectedPlacedCell]);

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPlacedCellId) return;

      const placed = placedCells.find((pc) => pc.id === selectedPlacedCellId);
      if (!placed) return;

      const step = e.shiftKey ? 10 : 1;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          updatePlacedCellPosition(
            selectedPlacedCellId,
            placed.x,
            placed.y - step,
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          updatePlacedCellPosition(
            selectedPlacedCellId,
            placed.x,
            placed.y + step,
          );
          break;
        case "ArrowLeft":
          e.preventDefault();
          updatePlacedCellPosition(
            selectedPlacedCellId,
            placed.x - step,
            placed.y,
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          updatePlacedCellPosition(
            selectedPlacedCellId,
            placed.x + step,
            placed.y,
          );
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          removePlacedCell(selectedPlacedCellId);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedPlacedCellId,
    placedCells,
    updatePlacedCellPosition,
    removePlacedCell,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* ズームコントロール */}
      <div className="shrink-0 bg-gray-200 px-4 py-2 flex items-center gap-2 border-b border-gray-300">
        <button
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="縮小"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-sm font-medium w-16 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="拡大"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1 rounded hover:bg-gray-300 ml-2"
          title="リセット"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div
        className="flex-1 relative overflow-auto"
        style={{
          backgroundColor: "#e5e5e5",
          backgroundImage:
            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleContainerClick}
      >
        {placedCellsWithInfo.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm text-center px-4">
            左の画像上のラベル
            <br />
            (A-1など)をクリックして追加
          </div>
        ) : (
          <>
            {/* 背景色（オプション） */}
            {useBackground && boundingBox && (
              <div
                className="absolute"
                style={{
                  left: boundingBox.x * scale,
                  top: boundingBox.y * scale,
                  width: boundingBox.width * scale,
                  height: boundingBox.height * scale,
                  backgroundColor: backgroundColor,
                }}
              />
            )}

            {/* 配置されたセル */}
            {placedCellsWithInfo.map((placed) => (
              <PlacedCellView
                key={placed.id}
                placed={placed}
                scale={scale}
                isSelected={selectedPlacedCellId === placed.id}
                onMouseDown={handleMouseDown}
                onRemove={removePlacedCell}
              />
            ))}

            {/* スナップガイドライン */}
            {guideLines.map((line, i) => (
              <div
                key={i}
                className="absolute bg-red-500"
                style={
                  line.type === "horizontal"
                    ? {
                        left: 0,
                        right: 0,
                        top: line.position * scale,
                        height: 1,
                      }
                    : {
                        top: 0,
                        bottom: 0,
                        left: line.position * scale,
                        width: 1,
                      }
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
