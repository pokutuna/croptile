import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Scissors } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { findCellBoundsAtPoint } from "../../utils/geometry";
import type { DraggingLine } from "../../types";
import { LineOverlay } from "./LineOverlay";
import { CellOverlay } from "./CellOverlay";
import { ImageUploader } from "../ImageUploader";
import { ZoomControls } from "../LayoutArea/ZoomControls";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";
import { useZoom } from "../../hooks/useZoom";

const GUTTER_SIZE = 16; // 左端・上端のカット領域の幅

export function CutCanvas() {
  useLocale(); // Re-render on locale change
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [gutterPos, setGutterPos] = useState<{
    type: "left" | "top";
    position: number;
  } | null>(null);
  const [draggingLine, setDraggingLine] = useState<DraggingLine | null>(null);

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
  } = useZoom({ gutterSize: GUTTER_SIZE, padding: 20 });

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

  // フィット系のハンドラ（activeImage依存のためラップ）
  const handleFitToView = useCallback(() => {
    if (!activeImage) return;
    zoomFitToView(
      { width: activeImage.width, height: activeImage.height },
      containerRef,
    );
  }, [activeImage, zoomFitToView]);

  const handleFitToWidth = useCallback(() => {
    if (!activeImage) return;
    zoomFitToWidth(activeImage.width, containerRef);
  }, [activeImage, zoomFitToWidth]);

  const handleFitToHeight = useCallback(() => {
    if (!activeImage) return;
    zoomFitToHeight(activeImage.height, containerRef);
  }, [activeImage, zoomFitToHeight]);

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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <ImageUploader />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ズームコントロール */}
      <div className="shrink-0 bg-gray-200 px-4 py-2 flex items-center gap-2 border-b border-gray-300">
        <ZoomControls
          scale={scale}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          canFit={true}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitToView={handleFitToView}
          onFitToWidth={handleFitToWidth}
          onFitToHeight={handleFitToHeight}
        />
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
              className="bg-gray-300"
              style={{ width: GUTTER_SIZE, height: GUTTER_SIZE }}
            />
            <div
              className="cursor-crosshair bg-gray-300 hover:bg-gray-400 transition-colors relative flex items-center overflow-hidden"
              style={{
                width: activeImage.width * scale,
                height: GUTTER_SIZE,
              }}
              onClick={handleTopGutterClick}
              onMouseMove={handleTopGutterMouseMove}
              onMouseLeave={handleGutterMouseLeave}
              title={t("clickToAddVerticalLine")}
            >
              {/* 100pxごとに区切り、ハサミ2つまたはテキストを交互配置 */}
              {(() => {
                const items: React.ReactNode[] = [];
                const totalWidth = activeImage.width * scale;
                const cellSize = 100;
                const count = Math.ceil(totalWidth / cellSize);

                for (let i = 0; i < count; i++) {
                  const cellStart = i * cellSize;
                  if (cellStart > totalWidth) break;

                  if (i % 2 === 0) {
                    // ハサミ2つ: 空白・ハサミ・空白(中央)・ハサミ・空白
                    const pos1 = cellStart + cellSize * 0.25;
                    const pos2 = cellStart + cellSize * 0.75;
                    if (pos1 < totalWidth) {
                      items.push(
                        <Scissors
                          key={`s1-${i}`}
                          size={10}
                          className="text-gray-500 absolute pointer-events-none"
                          style={{
                            left: pos1,
                            top: "50%",
                            transform: "translate(-50%, -50%) rotate(90deg)",
                          }}
                        />,
                      );
                    }
                    if (pos2 < totalWidth) {
                      items.push(
                        <Scissors
                          key={`s2-${i}`}
                          size={10}
                          className="text-gray-500 absolute pointer-events-none"
                          style={{
                            left: pos2,
                            top: "50%",
                            transform: "translate(-50%, -50%) rotate(90deg)",
                          }}
                        />,
                      );
                    }
                  } else {
                    // テキスト（中央）
                    const centerX = cellStart + cellSize / 2;
                    if (centerX < totalWidth) {
                      items.push(
                        <span
                          key={`t-${i}`}
                          className="text-gray-500 absolute pointer-events-none text-[9px] font-medium whitespace-nowrap"
                          style={{
                            left: centerX,
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          {t("cutVertical")}
                        </span>,
                      );
                    }
                  }
                }
                return items;
              })()}
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
              title={t("clickToAddHorizontalLine")}
            >
              {/* 100pxごとに区切り、ハサミ2つまたはテキストを交互配置 */}
              {(() => {
                const items: React.ReactNode[] = [];
                const totalHeight = activeImage.height * scale;
                const cellSize = 100;
                const count = Math.ceil(totalHeight / cellSize);

                for (let i = 0; i < count; i++) {
                  const cellStart = i * cellSize;
                  if (cellStart > totalHeight) break;

                  if (i % 2 === 0) {
                    // ハサミ2つ: 空白・ハサミ・空白(中央)・ハサミ・空白
                    const pos1 = cellStart + cellSize * 0.25;
                    const pos2 = cellStart + cellSize * 0.75;
                    if (pos1 < totalHeight) {
                      items.push(
                        <Scissors
                          key={`s1-${i}`}
                          size={10}
                          className="text-gray-500 absolute pointer-events-none"
                          style={{
                            top: pos1,
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        />,
                      );
                    }
                    if (pos2 < totalHeight) {
                      items.push(
                        <Scissors
                          key={`s2-${i}`}
                          size={10}
                          className="text-gray-500 absolute pointer-events-none"
                          style={{
                            top: pos2,
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        />,
                      );
                    }
                  } else {
                    // テキスト（中央、縦書き風）
                    const centerY = cellStart + cellSize / 2;
                    if (centerY < totalHeight) {
                      items.push(
                        <span
                          key={`t-${i}`}
                          className="text-gray-500 absolute pointer-events-none text-[9px] font-medium whitespace-nowrap"
                          style={{
                            top: centerY,
                            left: "50%",
                            transform: "translate(-50%, -50%) rotate(-90deg)",
                          }}
                        >
                          {t("cutHorizontal")}
                        </span>,
                      );
                    }
                  }
                }
                return items;
              })()}
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
