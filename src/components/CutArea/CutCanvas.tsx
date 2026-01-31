import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Scissors } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { findVerticalLineBounds } from "../../utils/geometry";
import type { DraggingLine } from "../../types";
import { LineOverlay } from "./LineOverlay";
import { CellOverlay } from "./CellOverlay";

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const GUTTER_SIZE = 8; // 左端・上端のカット領域の幅

export function CutCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [gutterPos, setGutterPos] = useState<{
    type: "left" | "top";
    position: number;
  } | null>(null);
  const [draggingLine, setDraggingLine] = useState<DraggingLine | null>(null);

  const activeImageId = useAppStore((state) => state.activeImageId);
  const images = useAppStore((state) => state.images);
  const horizontalLines = useAppStore((state) => state.horizontalLines);
  const verticalLines = useAppStore((state) => state.verticalLines);
  const cells = useAppStore((state) => state.cells);
  const placedCells = useAppStore((state) => state.placedCells);
  const cutDirection = useAppStore((state) => state.cutDirection);
  const addHorizontalLine = useAppStore((state) => state.addHorizontalLine);
  const addVerticalLine = useAppStore((state) => state.addVerticalLine);
  const updateHorizontalLine = useAppStore(
    (state) => state.updateHorizontalLine,
  );
  const updateVerticalLine = useAppStore((state) => state.updateVerticalLine);
  const removeHorizontalLine = useAppStore(
    (state) => state.removeHorizontalLine,
  );
  const removeVerticalLine = useAppStore((state) => state.removeVerticalLine);
  const addPlacedCell = useAppStore((state) => state.addPlacedCell);

  const activeImage = useMemo(
    () => images.find((img) => img.id === activeImageId),
    [images, activeImageId],
  );

  const imageHLines = useMemo(
    () => horizontalLines.filter((l) => l.imageId === activeImageId),
    [horizontalLines, activeImageId],
  );

  const imageVLines = useMemo(
    () => verticalLines.filter((l) => l.imageId === activeImageId),
    [verticalLines, activeImageId],
  );

  const imageCells = useMemo(
    () => cells.filter((c) => c.imageId === activeImageId),
    [cells, activeImageId],
  );

  const placedCellIds = useMemo(
    () => new Set(placedCells.map((pc) => pc.cellId)),
    [placedCells],
  );

  // 画像の描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = activeImage.dataUrl;
  }, [activeImage, scale]);

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

  // マウス位置を更新
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!activeImage) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      setMousePos({ x, y });

      // ドラッグ中は線を更新
      if (draggingLine) {
        if (draggingLine.type === "horizontal") {
          const clampedY = Math.max(0, Math.min(activeImage.height, y));
          updateHorizontalLine(draggingLine.id, clampedY);
        } else {
          const clampedX = Math.max(0, Math.min(activeImage.width, x));
          updateVerticalLine(draggingLine.id, clampedX);
        }
      }
    },
    [
      activeImage,
      scale,
      draggingLine,
      updateHorizontalLine,
      updateVerticalLine,
    ],
  );

  const handleMouseLeave = useCallback(() => {
    if (!draggingLine) {
      setMousePos(null);
    }
  }, [draggingLine]);

  // ガター上のマウス移動
  const handleLeftGutterMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!activeImage) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = (e.clientY - rect.top) / scale;
      setGutterPos({ type: "left", position: y });
    },
    [activeImage, scale],
  );

  const handleTopGutterMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!activeImage) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      setGutterPos({ type: "top", position: x });
    },
    [activeImage, scale],
  );

  const handleGutterMouseLeave = useCallback(() => {
    setGutterPos(null);
  }, []);

  // 左端ガター: 横線追加
  const handleLeftGutterClick = useCallback(
    (e: React.MouseEvent) => {
      if (!activeImage) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = (e.clientY - rect.top) / scale;
      addHorizontalLine({
        imageId: activeImage.id,
        y: Math.max(0, Math.min(activeImage.height, y)),
      });
    },
    [activeImage, scale, addHorizontalLine],
  );

  // 上端ガター: 縦線追加
  const handleTopGutterClick = useCallback(
    (e: React.MouseEvent) => {
      if (!activeImage) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      addVerticalLine({
        imageId: activeImage.id,
        x: Math.max(0, Math.min(activeImage.width, x)),
        topBoundY: 0,
        bottomBoundY: activeImage.height,
      });
    },
    [activeImage, scale, addVerticalLine],
  );

  // 画像上でのクリック: トグルで選択した方向でカット
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!activeImage || !mousePos || draggingLine) return;

      // 右クリックは無視
      if (e.button !== 0) return;

      if (cutDirection === "horizontal") {
        addHorizontalLine({
          imageId: activeImage.id,
          y: mousePos.y,
        });
      } else {
        const bounds = findVerticalLineBounds(
          mousePos.y,
          imageHLines,
          activeImage.height,
        );
        addVerticalLine({
          imageId: activeImage.id,
          x: mousePos.x,
          topBoundY: bounds.topBoundY,
          bottomBoundY: bounds.bottomBoundY,
        });
      }
    },
    [
      activeImage,
      mousePos,
      cutDirection,
      draggingLine,
      addHorizontalLine,
      addVerticalLine,
      imageHLines,
    ],
  );

  const handleLineMouseDown = useCallback(
    (type: "horizontal" | "vertical", id: string) => {
      setDraggingLine({ type, id });
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingLine(null);
  }, []);

  const handleLineDelete = useCallback(
    (type: "horizontal" | "vertical", id: string) => {
      if (type === "horizontal") {
        removeHorizontalLine(id);
      } else {
        removeVerticalLine(id);
      }
    },
    [removeHorizontalLine, removeVerticalLine],
  );

  const handleCellClick = useCallback(
    (cellId: string) => {
      addPlacedCell(cellId);
    },
    [addPlacedCell],
  );

  // 縦線プレビューの境界を計算
  const verticalPreviewBounds = useMemo(() => {
    if (!activeImage || !mousePos || cutDirection !== "vertical") return null;
    return findVerticalLineBounds(mousePos.y, imageHLines, activeImage.height);
  }, [activeImage, mousePos, cutDirection, imageHLines]);

  if (!activeImage) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        画像を追加してください
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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

      {/* キャンバス領域 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
        onMouseUp={handleMouseUp}
      >
        <div className="inline-flex flex-col">
          {/* 上端ガター（縦線用） */}
          <div className="flex">
            <div
              className="flex items-center justify-center"
              style={{ width: GUTTER_SIZE, height: GUTTER_SIZE }}
            >
              <Scissors size={8} className="text-gray-400" />
            </div>
            <div
              className="cursor-crosshair hover:bg-gray-100 transition-colors relative"
              style={{
                width: activeImage.width * scale,
                height: GUTTER_SIZE,
              }}
              onClick={handleTopGutterClick}
              onMouseMove={handleTopGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              title="クリックで縦カット線を追加"
            >
              {gutterPos?.type === "top" && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-green-500 pointer-events-none"
                  style={{ left: gutterPos.position * scale }}
                />
              )}
            </div>
          </div>

          <div className="flex">
            {/* 左端ガター（横線用） */}
            <div
              className="cursor-crosshair hover:bg-gray-100 transition-colors relative"
              style={{
                width: GUTTER_SIZE,
                height: activeImage.height * scale,
              }}
              onClick={handleLeftGutterClick}
              onMouseMove={handleLeftGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              title="クリックで横カット線を追加"
            >
              {gutterPos?.type === "left" && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-blue-500 pointer-events-none"
                  style={{ top: gutterPos.position * scale }}
                />
              )}
            </div>

            {/* 画像とオーバーレイ */}
            <div
              className="relative"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
              style={{
                cursor:
                  cutDirection === "horizontal" ? "row-resize" : "col-resize",
              }}
            >
              <canvas ref={canvasRef} className="block" />

              {/* セルオーバーレイ */}
              <CellOverlay
                cells={imageCells}
                placedCellIds={placedCellIds}
                scale={scale}
                onCellClick={handleCellClick}
              />

              {/* 線オーバーレイ */}
              <LineOverlay
                horizontalLines={imageHLines}
                verticalLines={imageVLines}
                scale={scale}
                imageWidth={activeImage.width}
                imageHeight={activeImage.height}
                mousePos={mousePos}
                cutMode={cutDirection}
                verticalPreviewBounds={verticalPreviewBounds}
                gutterPreview={gutterPos}
                onLineMouseDown={handleLineMouseDown}
                onLineDelete={handleLineDelete}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
