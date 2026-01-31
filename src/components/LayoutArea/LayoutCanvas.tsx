import { useCallback, useEffect, useState, useMemo } from "react";
import { useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { calculateSnap } from "../../utils/snap";
import type { Cell } from "../../types";
import { PlacedCellView } from "./PlacedCellView";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const GUTTER_SIZE = 20;

const BACKGROUND_PRESETS = [
  { key: "white", color: "#ffffff" },
  { key: "cream", color: "#fffef0" },
  { key: "ivory", color: "#fffff0" },
  { key: "sepiaLight", color: "#faf0e6" },
  { key: "sepia", color: "#f5e6d3" },
  { key: "sepiaDark", color: "#e8dcc8" },
] as const;

interface DragState {
  placedCellId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface PaintingState {
  placedCellId: string;
  points: { x: number; y: number }[];
}

export function LayoutCanvas() {
  useLocale(); // Re-render on locale change
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [paintingState, setPaintingState] = useState<PaintingState | null>(
    null,
  );
  const [snapLines, setSnapLines] = useState<
    { type: "horizontal" | "vertical"; position: number }[]
  >([]);
  const [userGuides, setUserGuides] = useState<
    { type: "horizontal" | "vertical"; position: number }[]
  >([]);
  const [gutterHover, setGutterHover] = useState<{
    type: "left" | "top";
    position: number;
  } | null>(null);

  const placedCells = useAppStore((state) => state.placedCells);
  const selectedPlacedCellId = useAppStore(
    (state) => state.selectedPlacedCellId,
  );
  const useBackground = useAppStore((state) => state.useBackground);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const setUseBackground = useAppStore((state) => state.setUseBackground);
  const setBackgroundColor = useAppStore((state) => state.setBackgroundColor);
  const paintStrokes = useAppStore((state) => state.paintStrokes);
  const paintMode = useAppStore((state) => state.paintMode);
  const paintColor = useAppStore((state) => state.paintColor);
  const paintWidth = useAppStore((state) => state.paintWidth);
  const addPaintStroke = useAppStore((state) => state.addPaintStroke);
  const removePaintStroke = useAppStore((state) => state.removePaintStroke);
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

  // 配置されたセルの情報（PlacedCellに全情報が含まれている）
  const placedCellsWithInfo = useMemo(() => {
    return placedCells.map((pc) => ({
      ...pc,
      cell: {
        id: pc.cellId,
        imageId: "",
        label: pc.label,
        rect: pc.rect,
      } as Cell,
      image: { dataUrl: pc.imageDataUrl },
    }));
  }, [placedCells]);

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

  const handleFitToView = useCallback(() => {
    if (!boundingBox || !containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - GUTTER_SIZE - 40;
    const containerHeight = container.clientHeight - GUTTER_SIZE - 40;
    const scaleX = containerWidth / boundingBox.width;
    const scaleY = containerHeight / boundingBox.height;
    const fitScale = Math.min(scaleX, scaleY, MAX_SCALE);
    setScale(Math.max(MIN_SCALE, fitScale));
  }, [boundingBox]);

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
      setSnapLines(snapResult.guideLines);
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
    setSnapLines([]);
  }, []);

  const handleContainerClick = useCallback(() => {
    if (!paintMode) {
      setSelectedPlacedCell(null);
    }
  }, [setSelectedPlacedCell, paintMode]);

  // 左ガター（横ガイド線）
  const handleLeftGutterMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = (e.clientY - rect.top) / scale;
      setGutterHover({ type: "left", position: y });
    },
    [scale],
  );

  const handleLeftGutterClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = Math.round((e.clientY - rect.top) / scale);
      // ±5px以内にガイドがあれば削除、なければ追加
      setUserGuides((prev) => {
        const existing = prev.find(
          (g) => g.type === "horizontal" && Math.abs(g.position - y) <= 5,
        );
        if (existing) {
          return prev.filter((g) => g !== existing);
        }
        return [...prev, { type: "horizontal", position: y }];
      });
    },
    [scale],
  );

  // 上ガター（縦ガイド線）
  const handleTopGutterMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      setGutterHover({ type: "top", position: x });
    },
    [scale],
  );

  const handleTopGutterClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / scale);
      // ±5px以内にガイドがあれば削除、なければ追加
      setUserGuides((prev) => {
        const existing = prev.find(
          (g) => g.type === "vertical" && Math.abs(g.position - x) <= 5,
        );
        if (existing) {
          return prev.filter((g) => g !== existing);
        }
        return [...prev, { type: "vertical", position: x }];
      });
    },
    [scale],
  );

  const handleGutterMouseLeave = useCallback(() => {
    setGutterHover(null);
  }, []);

  // ホバー位置が既存ガイドの削除範囲内かどうか
  const gutterHoverIsDelete = useMemo(() => {
    if (!gutterHover) return false;
    if (gutterHover.type === "left") {
      return userGuides.some(
        (g) =>
          g.type === "horizontal" &&
          Math.abs(g.position - gutterHover.position) <= 5,
      );
    } else {
      return userGuides.some(
        (g) =>
          g.type === "vertical" &&
          Math.abs(g.position - gutterHover.position) <= 5,
      );
    }
  }, [gutterHover, userGuides]);

  // セル上でのペン描画開始
  const handleCellPaintStart = useCallback(
    (
      e: React.MouseEvent,
      placedCellId: string,
      cellX: number,
      cellY: number,
    ) => {
      if (!paintMode) return;

      e.stopPropagation();
      // PlacedCellView から渡されたセル内座標を使用
      setPaintingState({ placedCellId, points: [{ x: cellX, y: cellY }] });
    },
    [paintMode],
  );

  // ペン描画中のマウス移動（コンテナ全体で追跡）
  const handlePaintMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!paintingState) return;

      // 描画中のセルを見つける
      const placed = placedCellsWithInfo.find(
        (p) => p.id === paintingState.placedCellId,
      );
      if (!placed) return;

      // コンテナの座標からセル内の相対座標を計算
      const containerRect = e.currentTarget.getBoundingClientRect();
      const containerX = (e.clientX - containerRect.left) / scale;
      const containerY = (e.clientY - containerRect.top) / scale;
      const x = containerX - placed.x;
      const y = containerY - placed.y;

      setPaintingState((prev) =>
        prev ? { ...prev, points: [...prev.points, { x, y }] } : null,
      );
    },
    [paintingState, scale, placedCellsWithInfo],
  );

  const handlePaintMouseUp = useCallback(() => {
    if (!paintingState || paintingState.points.length < 2) {
      setPaintingState(null);
      return;
    }

    addPaintStroke({
      placedCellId: paintingState.placedCellId,
      points: paintingState.points,
      color: paintColor,
      width: paintWidth,
    });

    setPaintingState(null);
  }, [paintingState, addPaintStroke, paintColor, paintWidth]);

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
          title={t("zoomOut")}
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
          title={t("zoomIn")}
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1 rounded hover:bg-gray-300 ml-2"
          title={t("resetZoom")}
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={handleFitToView}
          disabled={!boundingBox}
          className="p-1 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title={t("fitToView")}
        >
          <Maximize size={18} />
        </button>

        {/* 背景を塗りつぶす */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={useBackground}
              onChange={(e) => setUseBackground(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            {t("fillBackground")}
          </label>
          {useBackground && (
            <div className="flex items-center gap-1">
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setBackgroundColor(preset.color)}
                  className={`w-5 h-5 rounded border-2 transition-colors ${
                    backgroundColor === preset.color
                      ? "border-blue-500"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={t(preset.key)}
                />
              ))}
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-5 h-5 rounded border border-gray-300 cursor-pointer"
                title={t("customColor")}
              />
            </div>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100">
        <div className="inline-flex flex-col min-w-full min-h-full">
          {/* 上ガター（縦ガイド線用） */}
          <div className="flex sticky top-0 z-10">
            <div
              style={{ width: GUTTER_SIZE, height: GUTTER_SIZE }}
              className="bg-gray-200 shrink-0"
            />
            <div
              className="bg-gray-200 cursor-crosshair hover:bg-gray-300 transition-colors relative shrink-0 overflow-hidden"
              style={{ height: GUTTER_SIZE, minWidth: 1000 }}
              onMouseMove={handleTopGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              onClick={handleTopGutterClick}
              title={t("clickToAddVerticalGuide")}
            >
              {/* 10px間隔のメモリ */}
              {Array.from({ length: 201 }, (_, i) => i * 10).map((pos) => (
                <div
                  key={pos}
                  className="absolute bg-gray-400 pointer-events-none"
                  style={{
                    left: pos * scale,
                    top: pos % 100 === 0 ? 0 : GUTTER_SIZE / 2,
                    width: 1,
                    height: pos % 100 === 0 ? GUTTER_SIZE : GUTTER_SIZE / 2,
                  }}
                />
              ))}
              {gutterHover?.type === "top" && (
                <>
                  <div
                    className={`absolute top-0 bottom-0 w-0.5 pointer-events-none z-20 ${gutterHoverIsDelete ? "bg-red-500" : "bg-purple-500"}`}
                    style={{ left: gutterHover.position * scale }}
                  />
                  <div
                    className={`absolute text-xs px-1 rounded pointer-events-none z-20 ${gutterHoverIsDelete ? "text-red-700 bg-red-100" : "text-purple-700 bg-purple-100"}`}
                    style={{
                      left: gutterHover.position * scale + 4,
                      top: 2,
                    }}
                  >
                    {gutterHoverIsDelete
                      ? t("removeGuide")
                      : `${Math.round(gutterHover.position)}px`}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-1">
            {/* 左ガター（横ガイド線用） */}
            <div
              className="bg-gray-200 cursor-crosshair hover:bg-gray-300 transition-colors relative shrink-0 sticky left-0 z-10 overflow-hidden"
              style={{ width: GUTTER_SIZE, minHeight: 1000 }}
              onMouseMove={handleLeftGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              onClick={handleLeftGutterClick}
              title={t("clickToAddHorizontalGuide")}
            >
              {/* 10px間隔のメモリ */}
              {Array.from({ length: 201 }, (_, i) => i * 10).map((pos) => (
                <div
                  key={pos}
                  className="absolute bg-gray-400 pointer-events-none"
                  style={{
                    top: pos * scale,
                    left: pos % 100 === 0 ? 0 : GUTTER_SIZE / 2,
                    height: 1,
                    width: pos % 100 === 0 ? GUTTER_SIZE : GUTTER_SIZE / 2,
                  }}
                />
              ))}
              {gutterHover?.type === "left" && (
                <div
                  className={`absolute left-0 right-0 h-0.5 pointer-events-none ${gutterHoverIsDelete ? "bg-red-500" : "bg-purple-500"}`}
                  style={{ top: gutterHover.position * scale }}
                />
              )}
            </div>

            {/* メインキャンバス領域 */}
            <div
              className="relative flex-1"
              style={{
                backgroundColor: "#e5e5e5",
                backgroundImage:
                  "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                cursor: paintMode ? "crosshair" : "default",
                minHeight: 400,
              }}
              onMouseMove={
                paintingState ? handlePaintMouseMove : handleMouseMove
              }
              onMouseUp={paintingState ? handlePaintMouseUp : handleMouseUp}
              onMouseLeave={paintingState ? handlePaintMouseUp : handleMouseUp}
              onClick={handleContainerClick}
            >
              {/* ガターホバー時のpx表示（メイン領域内に配置） */}
              {gutterHover?.type === "left" && (
                <div
                  className={`absolute text-xs px-1 rounded pointer-events-none whitespace-nowrap z-50 ${gutterHoverIsDelete ? "text-red-700 bg-red-100" : "text-purple-700 bg-purple-100"}`}
                  style={{
                    top: gutterHover.position * scale + 4,
                    left: 4,
                  }}
                >
                  {gutterHoverIsDelete
                    ? t("removeGuide")
                    : `${Math.round(gutterHover.position)}px`}
                </div>
              )}
              {placedCellsWithInfo.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm text-center px-4">
                  {t("clickToAddToLayout")}
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
                      paintMode={paintMode}
                      paintStrokes={paintStrokes.filter(
                        (s) => s.placedCellId === placed.id,
                      )}
                      paintingState={
                        paintingState?.placedCellId === placed.id
                          ? paintingState
                          : null
                      }
                      paintColor={paintColor}
                      paintWidth={paintWidth}
                      onMouseDown={handleMouseDown}
                      onPaintStart={handleCellPaintStart}
                      onRemove={removePlacedCell}
                      onRemovePaintStroke={removePaintStroke}
                    />
                  ))}

                  {/* スナップガイドライン（ドラッグ中） */}
                  {snapLines.map((line, i) => (
                    <div
                      key={`snap-${i}`}
                      className="absolute bg-red-500 pointer-events-none"
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

              {/* ユーザーガイドライン（常に表示） */}
              {userGuides.map((guide, i) => (
                <div
                  key={`guide-${i}`}
                  className="absolute pointer-events-none"
                  style={
                    guide.type === "horizontal"
                      ? {
                          left: 0,
                          right: 0,
                          top: guide.position * scale,
                          height: 1,
                        }
                      : {
                          top: 0,
                          bottom: 0,
                          left: guide.position * scale,
                          width: 1,
                        }
                  }
                >
                  <div
                    className="absolute bg-purple-500"
                    style={
                      guide.type === "horizontal"
                        ? { left: 0, right: 0, height: 1 }
                        : { top: 0, bottom: 0, width: 1 }
                    }
                  />
                  <div
                    className="absolute text-xs text-purple-700 bg-purple-100 px-1 rounded whitespace-nowrap"
                    style={
                      guide.type === "horizontal"
                        ? { left: 4, top: 2 }
                        : { top: 4, left: 4 }
                    }
                  >
                    {guide.position}px
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
