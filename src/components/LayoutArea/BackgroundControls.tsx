import { Pipette } from "lucide-react";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";
import { getContrastColor } from "../../utils/color";

const BACKGROUND_PRESETS = [
  { key: "white", color: "#ffffff" },
  { key: "lightGray", color: "#f0f0f0" },
] as const;

interface BackgroundControlsProps {
  useBackground: boolean;
  backgroundColor: string;
  onUseBackgroundChange: (value: boolean) => void;
  onBackgroundColorChange: (color: string) => void;
}

export function BackgroundControls({
  useBackground,
  backgroundColor,
  onUseBackgroundChange,
  onBackgroundColorChange,
}: BackgroundControlsProps) {
  useLocale();

  const isPresetColor = BACKGROUND_PRESETS.some(
    (p) => p.color === backgroundColor,
  );

  return (
    <div className="flex items-center gap-2 ml-auto">
      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={useBackground}
          onChange={(e) => onUseBackgroundChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        {t("fillBackground")}
      </label>
      {useBackground && (
        <div className="flex items-center gap-1">
          {BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => onBackgroundColorChange(preset.color)}
              className={`w-5 h-5 rounded border-2 transition-colors ${
                backgroundColor === preset.color
                  ? "border-blue-500"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ backgroundColor: preset.color }}
              title={t(preset.key)}
            />
          ))}
          <div className="relative">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="w-5 h-5 rounded border border-gray-300 cursor-pointer opacity-0 absolute inset-0 z-10"
              title={t("customColor")}
            />
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center pointer-events-none ${
                !isPresetColor
                  ? "border-blue-500"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{
                backgroundColor: isPresetColor ? "#e5e5e5" : backgroundColor,
              }}
            >
              <Pipette
                size={12}
                style={{
                  color: getContrastColor(
                    isPresetColor ? "#e5e5e5" : backgroundColor,
                  ),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
