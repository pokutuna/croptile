import { useCallback, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { loadImage } from "../utils/image";
import { t } from "../i18n";
import { useLocale } from "../hooks/useLocale";

export function ImageUploader() {
  useLocale(); // Re-render on locale change
  const addImage = useAppStore((state) => state.addImage);
  const recalculateCells = useAppStore((state) => state.recalculateCells);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsLoading(true);
      try {
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
      } finally {
        setIsLoading(false);
      }
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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isLoading
          ? "border-blue-400 bg-blue-50 cursor-wait"
          : "border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
      }`}
      onDrop={isLoading ? undefined : handleDrop}
      onDragOver={isLoading ? undefined : handleDragOver}
      onClick={isLoading ? undefined : handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
        disabled={isLoading}
      />
      {isLoading ? (
        <div className="text-blue-500 flex flex-col items-center gap-2">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      ) : (
        <div className="text-gray-500">
          <p className="text-lg font-medium">{t("dropOrClickToSelect")}</p>
          <p className="text-sm mt-1">{t("supportedFormats")}</p>
        </div>
      )}
    </div>
  );
}
