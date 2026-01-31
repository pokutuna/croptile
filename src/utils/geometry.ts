import type { ScoreImage, HorizontalLine, VerticalLine, Cell } from "../types";

// セルを計算する
// 再帰的アプローチ: 領域を線で分割していく
export function calculateCells(
  image: ScoreImage,
  hLines: HorizontalLine[],
  vLines: VerticalLine[],
): Cell[] {
  const cells: Cell[] = [];
  let cellNumber = 1;

  // 再帰的に領域を分割
  function subdivide(
    leftX: number,
    topY: number,
    rightX: number,
    bottomY: number,
  ): void {
    // この領域に適用される横線を探す
    // 横線の範囲がこの領域のX範囲を完全にカバーする場合に適用
    const applicableHLines = hLines.filter(
      (hl) =>
        hl.leftBoundX <= leftX &&
        hl.rightBoundX >= rightX &&
        hl.y > topY &&
        hl.y < bottomY,
    );

    // この領域に適用される縦線を探す
    // 縦線の範囲がこの領域のY範囲を完全にカバーする場合に適用
    const applicableVLines = vLines.filter(
      (vl) =>
        vl.topBoundY <= topY &&
        vl.bottomBoundY >= bottomY &&
        vl.x > leftX &&
        vl.x < rightX,
    );

    // 両方の線を使ってグリッドを作成
    const yPositions = [
      topY,
      ...applicableHLines.map((l) => l.y).sort((a, b) => a - b),
      bottomY,
    ];
    const xPositions = [
      leftX,
      ...applicableVLines.map((l) => l.x).sort((a, b) => a - b),
      rightX,
    ];

    // 分割がない場合はセルとして追加
    if (yPositions.length === 2 && xPositions.length === 2) {
      cells.push({
        id: `${image.id}-${cellNumber}`,
        imageId: image.id,
        label: String(cellNumber),
        rect: {
          x: leftX,
          y: topY,
          width: rightX - leftX,
          height: bottomY - topY,
        },
      });
      cellNumber++;
      return;
    }

    // グリッドの各セルを再帰的に処理
    for (let row = 0; row < yPositions.length - 1; row++) {
      for (let col = 0; col < xPositions.length - 1; col++) {
        subdivide(
          xPositions[col],
          yPositions[row],
          xPositions[col + 1],
          yPositions[row + 1],
        );
      }
    }
  }

  // 画像全体から開始
  subdivide(0, 0, image.width, image.height);

  return cells;
}

// クリック位置を含むセルを見つけて、そのセルの境界を返す
export function findCellBoundsAtPoint(
  x: number,
  y: number,
  hLines: HorizontalLine[],
  vLines: VerticalLine[],
  imageWidth: number,
  imageHeight: number,
): { leftX: number; topY: number; rightX: number; bottomY: number } {
  // 再帰的にセルを探す
  function findBounds(
    leftX: number,
    topY: number,
    rightX: number,
    bottomY: number,
  ): { leftX: number; topY: number; rightX: number; bottomY: number } {
    // この領域に適用される横線
    const applicableHLines = hLines.filter(
      (hl) =>
        hl.leftBoundX <= leftX &&
        hl.rightBoundX >= rightX &&
        hl.y > topY &&
        hl.y < bottomY,
    );

    // この領域に適用される縦線
    const applicableVLines = vLines.filter(
      (vl) =>
        vl.topBoundY <= topY &&
        vl.bottomBoundY >= bottomY &&
        vl.x > leftX &&
        vl.x < rightX,
    );

    const yPositions = [
      topY,
      ...applicableHLines.map((l) => l.y).sort((a, b) => a - b),
      bottomY,
    ];
    const xPositions = [
      leftX,
      ...applicableVLines.map((l) => l.x).sort((a, b) => a - b),
      rightX,
    ];

    // 分割がない場合はこの境界を返す
    if (yPositions.length === 2 && xPositions.length === 2) {
      return { leftX, topY, rightX, bottomY };
    }

    // クリック位置を含むグリッドセルを見つけて再帰
    let targetRowIdx = 0;
    for (let i = 0; i < yPositions.length - 1; i++) {
      if (y >= yPositions[i] && y < yPositions[i + 1]) {
        targetRowIdx = i;
        break;
      }
      if (i === yPositions.length - 2) {
        targetRowIdx = i;
      }
    }

    let targetColIdx = 0;
    for (let i = 0; i < xPositions.length - 1; i++) {
      if (x >= xPositions[i] && x < xPositions[i + 1]) {
        targetColIdx = i;
        break;
      }
      if (i === xPositions.length - 2) {
        targetColIdx = i;
      }
    }

    return findBounds(
      xPositions[targetColIdx],
      yPositions[targetRowIdx],
      xPositions[targetColIdx + 1],
      yPositions[targetRowIdx + 1],
    );
  }

  return findBounds(0, 0, imageWidth, imageHeight);
}

// 点が矩形内にあるか判定
export function isPointInRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

// 2つの矩形の交差を判定
export function doRectsIntersect(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  );
}

// バウンディングボックスを計算
export function getBoundingBox(
  rects: { x: number; y: number; width: number; height: number }[],
): { x: number; y: number; width: number; height: number } | null {
  if (rects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
