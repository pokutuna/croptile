import { useState, useCallback, useRef, useEffect } from "react";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";

interface EditableZoomValueProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  minScale: number;
  maxScale: number;
  step?: number;
}

export function EditableZoomValue({
  scale,
  onScaleChange,
  minScale,
  maxScale,
  step = 0.1,
}: EditableZoomValueProps) {
  useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = Math.round(scale * 100);

  const handleClick = useCallback(() => {
    setInputValue(displayValue.toString());
    setIsEditing(true);
  }, [displayValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitValue = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      const newScale = Math.min(maxScale, Math.max(minScale, parsed / 100));
      onScaleChange(newScale);
    }
    setIsEditing(false);
  }, [inputValue, minScale, maxScale, onScaleChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitValue();
      } else if (e.key === "Escape") {
        setIsEditing(false);
      }
    },
    [commitValue],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -step : step;
      const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));
      onScaleChange(newScale);
    },
    [scale, onScaleChange, minScale, maxScale, step],
  );

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={commitValue}
        onKeyDown={handleKeyDown}
        className="text-sm font-medium w-16 text-center bg-white border border-gray-400 rounded px-1"
      />
    );
  }

  return (
    <span
      className="text-sm font-medium w-16 text-center cursor-pointer hover:bg-gray-300 rounded px-1 select-none"
      onClick={handleClick}
      onWheel={handleWheel}
      title={t("clickToEditZoom")}
    >
      {displayValue}%
    </span>
  );
}
