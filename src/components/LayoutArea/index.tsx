import { useCallback } from "react";
import { Download, Trash2, Pen, Move } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { exportToPng } from "../../utils/image";
import { LayoutCanvas } from "./LayoutCanvas";

interface LayoutAreaProps {
  widthPercent: number;
}

export function LayoutArea({ widthPercent }: LayoutAreaProps) {
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

  const handleExport = useCallback(async () => {
    const blob = await exportToPng(
      placedCells,
      useBackground ? backgroundColor : null,
      paintStrokes,
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
  }, [placedCells, useBackground, backgroundColor, paintStrokes]);

  return (
    <div
      className="flex flex-col bg-white min-w-0"
      style={{ width: `${widthPercent}%` }}
    >
      {/* ヘッダー */}
      <div className="shrink-0 px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">レイアウト</h2>
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
