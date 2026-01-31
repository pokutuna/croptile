import { useEffect, useState, useCallback, useRef } from "react";
import { Toolbar } from "./components/Toolbar";
import { CutArea } from "./components/CutArea";
import { LayoutArea } from "./components/LayoutArea";
import { ImageUploader } from "./components/ImageUploader";
import { useAppStore } from "./store/useAppStore";

function App() {
  const images = useAppStore((state) => state.images);
  const recalculateCells = useAppStore((state) => state.recalculateCells);
  const [splitRatio, setSplitRatio] = useState(0.6); // 左パネルの割合（60%）
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
        {images.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full">
              <ImageUploader />
            </div>
          </div>
        ) : (
          <>
            <CutArea widthPercent={splitRatio * 100} />
            <div
              className={`w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0 ${
                isDragging ? "bg-blue-500" : ""
              }`}
              onMouseDown={handleMouseDown}
            />
            <LayoutArea widthPercent={(1 - splitRatio) * 100} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
