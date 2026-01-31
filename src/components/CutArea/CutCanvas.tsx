import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Scissors, Maximize } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { findCellBoundsAtPoint } from "../../utils/geometry";
import type { DraggingLine } from "../../types";
import { LineOverlay } from "./LineOverlay";
import { CellOverlay } from "./CellOverlay";

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const GUTTER_SIZE = 16; // 左端・上端のカット領域の幅

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

  // 配置済みセルの判定用（rectベースで比較）
  const placedCellRects = useMemo(
    () =>
      new Set(
        placedCells.map(
          (pc) =>
            `${pc.rect.x},${pc.rect.y},${pc.rect.width},${pc.rect.height}`,
        ),
      ),
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

  const handleFitToView = useCallback(() => {
    if (!activeImage || !containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth - GUTTER_SIZE - 20;
    const containerHeight = container.clientHeight - GUTTER_SIZE - 20;
    const scaleX = containerWidth / activeImage.width;
    const scaleY = containerHeight / activeImage.height;
    const fitScale = Math.min(scaleX, scaleY, MAX_SCALE);
    setScale(Math.max(MIN_SCALE, fitScale));
  }, [activeImage]);

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

  // 左端ガター: 横線追加（端から端まで）
  const handleLeftGutterClick = useCallback(
    (e: React.MouseEvent) => {
      if (!activeImage) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = (e.clientY - rect.top) / scale;
      addHorizontalLine({
        imageId: activeImage.id,
        y: Math.max(0, Math.min(activeImage.height, y)),
        leftBoundX: 0,
        rightBoundX: activeImage.width,
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

      // クリック位置のセルを見つけて、その境界内で線を引く
      const cellBounds = findCellBoundsAtPoint(
        mousePos.x,
        mousePos.y,
        imageHLines,
        imageVLines,
        activeImage.width,
        activeImage.height,
      );

      if (cutDirection === "horizontal") {
        addHorizontalLine({
          imageId: activeImage.id,
          y: mousePos.y,
          leftBoundX: cellBounds.leftX,
          rightBoundX: cellBounds.rightX,
        });
      } else {
        addVerticalLine({
          imageId: activeImage.id,
          x: mousePos.x,
          topBoundY: cellBounds.topY,
          bottomBoundY: cellBounds.bottomY,
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
      imageVLines,
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

  // プレビュー用のセル境界を計算
  const previewCellBounds = useMemo(() => {
    if (!activeImage || !mousePos) return null;
    return findCellBoundsAtPoint(
      mousePos.x,
      mousePos.y,
      imageHLines,
      imageVLines,
      activeImage.width,
      activeImage.height,
    );
  }, [activeImage, mousePos, imageHLines, imageVLines]);

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
          title="100%にリセット"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={handleFitToView}
          className="p-1 rounded hover:bg-gray-300"
          title="全体を表示"
        >
          <Maximize size={18} />
        </button>
      </div>

      {/* キャンバス領域 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{
          backgroundColor: "#e5e5e5",
          backgroundImage:
            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        }}
        onMouseUp={handleMouseUp}
      >
        <div className="inline-block align-top">
          {/* 上端ガター（縦線用） */}
          <div className="flex">
            <div
              className="flex items-center justify-center bg-gray-300"
              style={{ width: GUTTER_SIZE, height: GUTTER_SIZE }}
            >
              <Scissors size={12} className="text-gray-500" />
            </div>
            <div
              className="cursor-crosshair bg-gray-300 hover:bg-gray-400 transition-colors relative flex items-center overflow-hidden"
              style={{
                width: activeImage.width * scale,
                height: GUTTER_SIZE,
              }}
              onClick={handleTopGutterClick}
              onMouseMove={handleTopGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              title="クリックで縦カット線を追加"
            >
              {/* ハサミアイコンを100px間隔で配置 */}
              {Array.from(
                { length: Math.floor((activeImage.width * scale) / 100) },
                (_, i) => (
                  <Scissors
                    key={i}
                    size={10}
                    className="text-gray-500 absolute pointer-events-none"
                    style={{
                      left: (i + 1) * 100 - 5,
                      transform: "rotate(90deg)",
                    }}
                  />
                ),
              )}
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
              className="cursor-crosshair bg-gray-300 hover:bg-gray-400 transition-colors relative flex flex-col items-center overflow-hidden"
              style={{
                width: GUTTER_SIZE,
                height: activeImage.height * scale,
              }}
              onClick={handleLeftGutterClick}
              onMouseMove={handleLeftGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              title="クリックで横カット線を追加"
            >
              {/* ハサミアイコンを100px間隔で配置 */}
              {Array.from(
                { length: Math.floor((activeImage.height * scale) / 100) },
                (_, i) => (
                  <Scissors
                    key={i}
                    size={10}
                    className="text-gray-500 absolute pointer-events-none"
                    style={{ top: (i + 1) * 100 - 5 }}
                  />
                ),
              )}
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
                placedCellRects={placedCellRects}
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
                previewCellBounds={previewCellBounds}
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
