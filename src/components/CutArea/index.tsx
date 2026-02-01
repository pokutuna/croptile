import { useCallback, useRef } from "react";
import {
  ImagePlus,
  Trash2,
  X,
  FlipHorizontal2,
  FlipVertical2,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { loadImage } from "../../utils/image";
import { CutCanvas } from "./CutCanvas";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";

const MAX_PAGES = 3;

interface CutAreaProps {
  widthPercent: number;
}

export function CutArea({ widthPercent }: CutAreaProps) {
  useLocale(); // Re-render on locale change
  const images = useAppStore((state) => state.images);
  const activeImageId = useAppStore((state) => state.activeImageId);
  const setActiveImage = useAppStore((state) => state.setActiveImage);
  const addImage = useAppStore((state) => state.addImage);
  const removeImage = useAppStore((state) => state.removeImage);
  const recalculateCells = useAppStore((state) => state.recalculateCells);
  const clearLinesForImage = useAppStore((state) => state.clearLinesForImage);
  const horizontalLines = useAppStore((state) => state.horizontalLines);
  const verticalLines = useAppStore((state) => state.verticalLines);
  const cutDirection = useAppStore((state) => state.cutDirection);
  const setCutDirection = useAppStore((state) => state.setCutDirection);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasLinesForActiveImage =
    activeImageId &&
    (horizontalLines.some((l) => l.imageId === activeImageId) ||
      verticalLines.some((l) => l.imageId === activeImageId));

  const canAddMore = images.length < MAX_PAGES;

  const handleAddImage = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const remainingSlots = MAX_PAGES - images.length;
      const filesToAdd = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToAdd) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const scoreImage = await loadImage(file);
          addImage(scoreImage);
        } catch {
          alert(t("imageLoadFailed", { name: file.name }));
        }
      }
      recalculateCells();
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [addImage, recalculateCells, images.length],
  );

  const handleClearLines = useCallback(() => {
    if (activeImageId) {
      clearLinesForImage(activeImageId);
    }
  }, [activeImageId, clearLinesForImage]);

  const handleRemoveImage = useCallback(
    (imageId: string, index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm(t("deletePageConfirm", { n: index + 1 }))) {
        removeImage(imageId);
      }
    },
    [removeImage],
  );

  return (
    <div
      className="flex flex-col min-w-0"
      style={{ width: `${widthPercent}%` }}
    >
      {/* ヘッダー */}
      <div className="shrink-0 px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-3">
        <h2 className="font-semibold text-gray-700">{t("cut")}</h2>

        {/* ページタブ */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {images.map((image, index) => (
            <div
              key={image.id}
              className={`flex items-center gap-1 px-2 py-1 text-sm whitespace-nowrap cursor-pointer rounded transition-colors ${
                activeImageId === image.id
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
              onClick={() => setActiveImage(image.id)}
            >
              <span>
                {t("page")} {index + 1}
              </span>
              <button
                onClick={(e) => handleRemoveImage(image.id, index, e)}
                className={`p-0.5 rounded ${
                  activeImageId === image.id
                    ? "hover:bg-blue-600"
                    : "hover:bg-gray-200"
                }`}
                title={t("deletePage")}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* 画像追加ボタン */}
          {canAddMore && (
            <button
              onClick={handleAddImage}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              title={t("addImage")}
            >
              <ImagePlus size={16} />
            </button>
          )}
        </div>

        {/* 切り取り方向トグル - 中央配置 */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center rounded border border-gray-300 overflow-hidden">
            <button
              onClick={() => setCutDirection("vertical")}
              className={`flex items-center gap-1 px-3 py-1 text-sm transition-colors ${
                cutDirection === "vertical"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              title={t("cutVertical")}
            >
              <FlipHorizontal2 size={16} />
              {t("cutVertical")}
            </button>
            <button
              onClick={() => setCutDirection("horizontal")}
              className={`flex items-center gap-1 px-3 py-1 text-sm transition-colors ${
                cutDirection === "horizontal"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              title={t("cutHorizontal")}
            >
              <FlipVertical2 size={16} />
              {t("cutHorizontal")}
            </button>
          </div>
        </div>

        {/* リセットボタン */}
        <button
          onClick={handleClearLines}
          disabled={!hasLinesForActiveImage}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          title={t("deleteAllLinesForPage")}
        >
          <Trash2 size={16} />
          {t("reset")}
        </button>
      </div>

      <CutCanvas />
    </div>
  );
}
