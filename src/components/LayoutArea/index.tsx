import { useCallback } from "react";
import { Download, Trash2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { exportToPng } from "../../utils/image";
import { LayoutCanvas } from "./LayoutCanvas";

const BACKGROUND_PRESETS = [
  { name: "白", color: "#ffffff" },
  { name: "クリーム", color: "#fffef0" },
  { name: "アイボリー", color: "#fffff0" },
  { name: "セピア薄", color: "#faf0e6" },
  { name: "セピア", color: "#f5e6d3" },
  { name: "セピア濃", color: "#e8dcc8" },
];

interface LayoutAreaProps {
  widthPercent: number;
}

export function LayoutArea({ widthPercent }: LayoutAreaProps) {
  const placedCells = useAppStore((state) => state.placedCells);
  const cells = useAppStore((state) => state.cells);
  const images = useAppStore((state) => state.images);
  const clearLayout = useAppStore((state) => state.clearLayout);
  const useBackground = useAppStore((state) => state.useBackground);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const setUseBackground = useAppStore((state) => state.setUseBackground);
  const setBackgroundColor = useAppStore((state) => state.setBackgroundColor);

  const handleExport = useCallback(async () => {
    const blob = await exportToPng(
      placedCells,
      cells,
      images,
      useBackground ? backgroundColor : null,
    );
    if (!blob) {
      alert("エクスポートするセルがありません");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "score-export.png";
    a.click();
    URL.revokeObjectURL(url);
  }, [placedCells, cells, images, useBackground, backgroundColor]);

  return (
    <div
      className="flex flex-col bg-white min-w-0"
      style={{ width: `${widthPercent}%` }}
    >
      {/* ヘッダー */}
      <div className="shrink-0 px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">レイアウト</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useBackground}
                onChange={(e) => setUseBackground(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              背景
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
                    title={preset.name}
                  />
                ))}
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-5 h-5 rounded border border-gray-300 cursor-pointer"
                  title="カスタム色"
                />
              </div>
            )}
          </div>
          <button
            onClick={clearLayout}
            disabled={placedCells.length === 0}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="レイアウトをクリア"
          >
            <Trash2 size={16} />
            クリア
          </button>
          <button
            onClick={handleExport}
            disabled={placedCells.length === 0}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            エクスポート
          </button>
        </div>
      </div>
      <LayoutCanvas />
    </div>
  );
}
