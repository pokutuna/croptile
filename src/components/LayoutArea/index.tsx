import { useCallback } from "react";
import { Download, Trash2, Pen, Move, ChevronDown, Undo2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { exportToPng } from "../../utils/image";
import { LayoutCanvas } from "./LayoutCanvas";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";

// showSaveFilePicker の型定義
declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle>;
  }
}

interface LayoutAreaProps {
  widthPercent: number;
}

export function LayoutArea({ widthPercent }: LayoutAreaProps) {
  useLocale(); // Re-render on locale change
  const placedCells = useAppStore((state) => state.placedCells);
  const clearLayout = useAppStore((state) => state.clearLayout);
  const useBackground = useAppStore((state) => state.useBackground);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const paintStrokes = useAppStore((state) => state.paintStrokes);
  const paintMode = useAppStore((state) => state.paintMode);
  const paintColor = useAppStore((state) => state.paintColor);
  const paintWidth = useAppStore((state) => state.paintWidth);
  const setPaintMode = useAppStore((state) => state.setPaintMode);
  const setPaintColor = useAppStore((state) => state.setPaintColor);
  const setPaintWidth = useAppStore((state) => state.setPaintWidth);
  const setHasCompletedTutorial = useAppStore(
    (state) => state.setHasCompletedTutorial,
  );
  const undoLastPaintStroke = useAppStore((state) => state.undoLastPaintStroke);

  const getBlob = useCallback(async () => {
    const blob = await exportToPng(
      placedCells,
      useBackground ? backgroundColor : null,
      paintStrokes,
    );
    if (!blob) {
      alert("No cells to export");
      return null;
    }
    return blob;
  }, [placedCells, useBackground, backgroundColor, paintStrokes]);

  // 通常のダウンロード
  const handleDownload = useCallback(async () => {
    const blob = await getBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "croptile-export.png";
    a.click();
    URL.revokeObjectURL(url);
    setHasCompletedTutorial(true);
  }, [getBlob, setHasCompletedTutorial]);

  // 保存場所を選ぶダイアログ（対応ブラウザのみ）
  const handleSaveAs = useCallback(async () => {
    const blob = await getBlob();
    if (!blob) return;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: "croptile-export.png",
          types: [
            {
              description: "PNG Image",
              accept: { "image/png": [".png"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setHasCompletedTutorial(true);
      } catch (e) {
        // ユーザーがキャンセルした場合など
        if ((e as Error).name !== "AbortError") {
          console.error("Save failed:", e);
        }
      }
    } else {
      // 非対応ブラウザは通常ダウンロードにフォールバック
      handleDownload();
    }
  }, [getBlob, handleDownload, setHasCompletedTutorial]);

  const supportsSaveAs =
    typeof window !== "undefined" && !!window.showSaveFilePicker;

  return (
    <div
      className="flex flex-col bg-white min-w-0"
      style={{ width: `${widthPercent}%` }}
    >
      {/* ヘッダー */}
      <div className="shrink-0 px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">{t("layout")}</h2>
        <div className="flex items-center gap-3">
          {/* モード切り替え: 移動 / ペン */}
          <div className="flex items-center rounded border border-gray-300 overflow-hidden">
            <button
              onClick={() => setPaintMode(false)}
              className={`flex items-center gap-1 px-2 py-1 text-sm transition-colors ${
                !paintMode
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              title="移動モード"
            >
              <Move size={16} />
            </button>
            <button
              onClick={() => setPaintMode(true)}
              className={`flex items-center gap-1 px-2 py-1 text-sm transition-colors ${
                paintMode
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              title="ペンモード"
            >
              <Pen size={16} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={paintColor}
              onChange={(e) => setPaintColor(e.target.value)}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
              title="色を選択"
            />
            <input
              type="range"
              min="2"
              max="50"
              value={paintWidth}
              onChange={(e) => setPaintWidth(Number(e.target.value))}
              className="w-16 h-4"
              title={`ペン幅: ${paintWidth}px`}
            />
            <button
              onClick={undoLastPaintStroke}
              disabled={paintStrokes.length === 0}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
          </div>
          <button
            onClick={clearLayout}
            disabled={placedCells.length === 0}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            title={t("clear")}
          >
            <Trash2 size={16} />
            {t("clear")}
          </button>
          <div className="flex gap-0.5 bg-gray-100 rounded">
            <button
              onClick={handleDownload}
              disabled={placedCells.length === 0}
              className={`flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${supportsSaveAs ? "rounded-l" : "rounded"}`}
            >
              <Download size={16} />
              {t("download")}
            </button>
            {supportsSaveAs && (
              <button
                onClick={handleSaveAs}
                disabled={placedCells.length === 0}
                className="flex items-center px-1 py-1 text-sm bg-green-500 text-white rounded-r hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                title={t("saveAs")}
              >
                <ChevronDown size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      <LayoutCanvas />
    </div>
  );
}
