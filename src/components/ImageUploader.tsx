import { useCallback, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { loadImage } from "../utils/image";

export function ImageUploader() {
  const addImage = useAppStore((state) => state.addImage);
  const recalculateCells = useAppStore((state) => state.recalculateCells);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        try {
          const scoreImage = await loadImage(file);
          addImage(scoreImage);
        } catch (error) {
          console.error("Failed to load image:", error);
        }
      }
      recalculateCells();
    },
    [addImage, recalculateCells],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      <div className="text-gray-500">
        <p className="text-lg font-medium">
          画像をドロップ、またはクリックして選択
        </p>
        <p className="text-sm mt-1">PNG, JPEG対応</p>
      </div>
    </div>
  );
}
