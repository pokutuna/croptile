import { useCallback, useEffect, useState, useMemo } from "react";
import { useRef } from "react";
import { useAppStore } from "../../store/useAppStore";
import { calculateSnap } from "../../utils/snap";
import type { Cell, DragState, PaintingState, GuideLine } from "../../types";
import { PlacedCellView } from "./PlacedCellView";
import { ZoomControls } from "./ZoomControls";
import { BackgroundControls } from "./BackgroundControls";
import { TutorialPanel } from "./TutorialPanel";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";
import { useZoom } from "../../hooks/useZoom";

const GUTTER_SIZE = 20;

export function LayoutCanvas() {
  useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [paintingState, setPaintingState] = useState<PaintingState | null>(
    null,
  );
  const [snapLines, setSnapLines] = useState<GuideLine[]>([]);
  const [userGuides, setUserGuides] = useState<GuideLine[]>([]);
  const [gutterHover, setGutterHover] = useState<{
    type: "left" | "top";
    position: number;
  } | null>(null);

  const {
    scale,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleFitToView: zoomFitToView,
    handleFitToWidth: zoomFitToWidth,
    handleFitToHeight: zoomFitToHeight,
    canZoomIn,
    canZoomOut,
  } = useZoom({ gutterSize: GUTTER_SIZE, padding: 40 });

  const images = useAppStore((state) => state.images);
  const cells = useAppStore((state) => state.cells);
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
  const undoLastPaintStroke = useAppStore((state) => state.undoLastPaintStroke);
  const hasCompletedTutorial = useAppStore(
    (state) => state.hasCompletedTutorial,
  );
  const hasCleared = useAppStore((state) => state.hasCleared);
  const updatePlacedCellPosition = useAppStore(
    (state) => state.updatePlacedCellPosition,
  );
  const removePlacedCell = useAppStore((state) => state.removePlacedCell);
  const setSelectedPlacedCell = useAppStore(
    (state) => state.setSelectedPlacedCell,
  );

  // 配置されたセルの情報
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

  // フィット系のハンドラ（boundingBox依存のためラップ）
  const handleFitToView = useCallback(() => {
    zoomFitToView(boundingBox, containerRef);
  }, [boundingBox, zoomFitToView]);

  const handleFitToWidth = useCallback(() => {
    zoomFitToWidth(boundingBox?.width ?? null, containerRef);
  }, [boundingBox, zoomFitToWidth]);

  const handleFitToHeight = useCallback(() => {
    zoomFitToHeight(boundingBox?.height ?? null, containerRef);
  }, [boundingBox, zoomFitToHeight]);

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

      if (e.altKey) {
        setSnapLines([]);
        updatePlacedCellPosition(dragState.placedCellId, newX, newY);
      } else {
        const snapResult = calculateSnap(movingRect, otherRects, newX, newY);
        setSnapLines(snapResult.guideLines);
        updatePlacedCellPosition(
          dragState.placedCellId,
          snapResult.x,
          snapResult.y,
        );
      }
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

  // ガター操作
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
      setUserGuides((prev) => {
        const existing = prev.find(
          (g) => g.type === "horizontal" && Math.abs(g.position - y) <= 5,
        );
        if (existing) {
          return prev.filter((g) => g !== existing);
        }
        return [...prev, { type: "horizontal" as const, position: y }];
      });
    },
    [scale],
  );

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
      setUserGuides((prev) => {
        const existing = prev.find(
          (g) => g.type === "vertical" && Math.abs(g.position - x) <= 5,
        );
        if (existing) {
          return prev.filter((g) => g !== existing);
        }
        return [...prev, { type: "vertical" as const, position: x }];
      });
    },
    [scale],
  );

  const handleGutterMouseLeave = useCallback(() => {
    setGutterHover(null);
  }, []);

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

  // ペン操作
  const handleCellPaintStart = useCallback(
    (
      e: React.MouseEvent,
      placedCellId: string,
      cellX: number,
      cellY: number,
    ) => {
      if (!paintMode) return;
      e.stopPropagation();
      setPaintingState({ placedCellId, points: [{ x: cellX, y: cellY }] });
    },
    [paintMode],
  );

  const handlePaintMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!paintingState) return;

      const placed = placedCellsWithInfo.find(
        (p) => p.id === paintingState.placedCellId,
      );
      if (!placed) return;

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
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undoLastPaintStroke();
        return;
      }

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
    undoLastPaintStroke,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* ズームコントロール */}
      <div className="shrink-0 bg-gray-200 px-4 py-2 flex items-center gap-2 border-b border-gray-300">
        <ZoomControls
          scale={scale}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          canFit={!!boundingBox}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitToView={handleFitToView}
          onFitToWidth={handleFitToWidth}
          onFitToHeight={handleFitToHeight}
        />
        <BackgroundControls
          useBackground={useBackground}
          backgroundColor={backgroundColor}
          onUseBackgroundChange={setUseBackground}
          onBackgroundColorChange={setBackgroundColor}
        />
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 relative"
      >
        <div className="inline-flex flex-col min-w-full min-h-full">
          {/* 上ガター */}
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
            {/* 左ガター */}
            <div
              className="bg-gray-200 cursor-crosshair hover:bg-gray-300 transition-colors relative shrink-0 sticky left-0 z-10 overflow-hidden"
              style={{ width: GUTTER_SIZE, minHeight: 1000 }}
              onMouseMove={handleLeftGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              onClick={handleLeftGutterClick}
              title={t("clickToAddHorizontalGuide")}
            >
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

            {/* メインキャンバス */}
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

              {placedCellsWithInfo.length > 0 && (
                <>
                  {useBackground && boundingBox && (
                    <div
                      className="absolute"
                      style={{
                        left: 0,
                        top: 0,
                        width: (boundingBox.x + boundingBox.width) * scale,
                        height: (boundingBox.y + boundingBox.height) * scale,
                        backgroundColor: backgroundColor,
                      }}
                    />
                  )}

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
                    />
                  ))}

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

        {placedCellsWithInfo.length === 0 && (
          <TutorialPanel
            hasImages={images.length > 0}
            hasCells={cells.length > 1}
            hasCompletedTutorial={hasCompletedTutorial}
            hasCleared={hasCleared}
          />
        )}
      </div>
    </div>
  );
}
