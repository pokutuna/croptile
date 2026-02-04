import type { LabelPosition } from "../types";

/**
 * Get CSS position style for label placement
 */
export function getLabelPositionStyle(
  position: LabelPosition,
): React.CSSProperties {
  switch (position) {
    case "top-left":
      return { top: 4, left: 4 };
    case "center":
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    case "top-right":
      return { top: 4, right: 4 };
  }
}

/**
 * Icons for label position toggle button
 */
export const labelPositionIcons: Record<LabelPosition, string> = {
  "top-left": "↖",
  center: "✛",
  "top-right": "↗",
};

/**
 * i18n keys for label position names
 */
export const labelPositionKeys: Record<
  LabelPosition,
  "labelTopLeft" | "labelCenter" | "labelTopRight"
> = {
  "top-left": "labelTopLeft",
  center: "labelCenter",
  "top-right": "labelTopRight",
};
