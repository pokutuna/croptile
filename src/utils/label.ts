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
    case "top-right":
      return { top: 4, right: 4 };
    case "center":
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    case "bottom-left":
      return { bottom: 4, left: 4 };
    case "bottom-right":
      return { bottom: 4, right: 4 };
  }
}

/**
 * Icons for label position toggle button
 */
export const labelPositionIcons: Record<LabelPosition, string> = {
  "top-left": "↖",
  "top-right": "↗",
  center: "✛",
  "bottom-left": "↙",
  "bottom-right": "↘",
};
