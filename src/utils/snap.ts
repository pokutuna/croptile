const SNAP_THRESHOLD = 8;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  guideLines: { type: "horizontal" | "vertical"; position: number }[];
}

export function calculateSnap(
  movingRect: Rect,
  targetRects: Rect[],
  currentX: number,
  currentY: number,
): SnapResult {
  const result: SnapResult = {
    x: currentX,
    y: currentY,
    snappedX: false,
    snappedY: false,
    guideLines: [],
  };

  const movingEdges = {
    left: currentX,
    right: currentX + movingRect.width,
    top: currentY,
    bottom: currentY + movingRect.height,
  };

  let minDeltaX = SNAP_THRESHOLD + 1;
  let minDeltaY = SNAP_THRESHOLD + 1;

  for (const target of targetRects) {
    const targetEdges = {
      left: target.x,
      right: target.x + target.width,
      top: target.y,
      bottom: target.y + target.height,
    };

    // X軸のスナップ
    // 左辺-左辺
    let deltaX = Math.abs(movingEdges.left - targetEdges.left);
    if (deltaX < minDeltaX) {
      minDeltaX = deltaX;
      result.x = targetEdges.left;
      result.snappedX = true;
    }

    // 右辺-右辺
    deltaX = Math.abs(movingEdges.right - targetEdges.right);
    if (deltaX < minDeltaX) {
      minDeltaX = deltaX;
      result.x = targetEdges.right - movingRect.width;
      result.snappedX = true;
    }

    // 左辺-右辺
    deltaX = Math.abs(movingEdges.left - targetEdges.right);
    if (deltaX < minDeltaX) {
      minDeltaX = deltaX;
      result.x = targetEdges.right;
      result.snappedX = true;
    }

    // 右辺-左辺
    deltaX = Math.abs(movingEdges.right - targetEdges.left);
    if (deltaX < minDeltaX) {
      minDeltaX = deltaX;
      result.x = targetEdges.left - movingRect.width;
      result.snappedX = true;
    }

    // Y軸のスナップ
    // 上辺-上辺
    let deltaY = Math.abs(movingEdges.top - targetEdges.top);
    if (deltaY < minDeltaY) {
      minDeltaY = deltaY;
      result.y = targetEdges.top;
      result.snappedY = true;
    }

    // 下辺-下辺
    deltaY = Math.abs(movingEdges.bottom - targetEdges.bottom);
    if (deltaY < minDeltaY) {
      minDeltaY = deltaY;
      result.y = targetEdges.bottom - movingRect.height;
      result.snappedY = true;
    }

    // 上辺-下辺
    deltaY = Math.abs(movingEdges.top - targetEdges.bottom);
    if (deltaY < minDeltaY) {
      minDeltaY = deltaY;
      result.y = targetEdges.bottom;
      result.snappedY = true;
    }

    // 下辺-上辺
    deltaY = Math.abs(movingEdges.bottom - targetEdges.top);
    if (deltaY < minDeltaY) {
      minDeltaY = deltaY;
      result.y = targetEdges.top - movingRect.height;
      result.snappedY = true;
    }
  }

  // ガイドライン生成
  if (result.snappedX) {
    result.guideLines.push({ type: "vertical", position: result.x });
    result.guideLines.push({
      type: "vertical",
      position: result.x + movingRect.width,
    });
  }
  if (result.snappedY) {
    result.guideLines.push({ type: "horizontal", position: result.y });
    result.guideLines.push({
      type: "horizontal",
      position: result.y + movingRect.height,
    });
  }

  return result;
}
