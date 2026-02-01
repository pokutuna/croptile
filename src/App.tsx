import { useEffect, useState, useCallback, useRef } from "react";
import { GripVertical } from "lucide-react";
import { Toolbar } from "./components/Toolbar";
import { CutArea } from "./components/CutArea";
import { LayoutArea } from "./components/LayoutArea";
import { useAppStore } from "./store/useAppStore";

function App() {
  const recalculateCells = useAppStore((state) => state.recalculateCells);
  const [splitRatio, setSplitRatio] = useState(0.5); // 左パネルの割合（50%）
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // 初期化時にセルを再計算（ストアから復元した場合）
  useEffect(() => {
    recalculateCells();
  }, [recalculateCells]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0.2, Math.min(0.8, x / rect.width));
      setSplitRatio(ratio);
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }
  }, [isDragging]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Toolbar />
      <main
        ref={containerRef}
        className="flex-1 flex overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <CutArea widthPercent={splitRatio * 100} />
        <div
          className={`w-2 bg-gray-300 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0 flex items-center justify-center relative ${
            isDragging ? "bg-blue-500" : ""
          }`}
          onMouseDown={handleMouseDown}
        >
          <div
            className={`absolute bg-gray-400 hover:bg-blue-500 rounded py-2 px-0.5 shadow-sm transition-colors ${
              isDragging ? "bg-blue-600" : ""
            }`}
          >
            <GripVertical size={12} className="text-white" />
          </div>
        </div>
        <LayoutArea widthPercent={(1 - splitRatio) * 100} />
      </main>
    </div>
  );
}

export default App;
