import type { ScoreImage, HorizontalLine, VerticalLine, Cell } from "../types";

// セルを計算する
export function calculateCells(
  image: ScoreImage,
  hLines: HorizontalLine[],
  vLines: VerticalLine[],
): Cell[] {
  const cells: Cell[] = [];

  // 横線のY座標（ソート済み）+ 画像の上端と下端
  const yBounds = [0, ...hLines.map((l) => l.y), image.height];

  // 行ごとにセルを生成
  for (let rowIndex = 0; rowIndex < yBounds.length - 1; rowIndex++) {
    const topY = yBounds[rowIndex];
    const bottomY = yBounds[rowIndex + 1];
    const rowLabel = String.fromCharCode(65 + rowIndex); // A, B, C...

    // この行（帯）に含まれる縦線を取得
    const bandVLines = vLines
      .filter((vl) => vl.topBoundY <= topY && vl.bottomBoundY >= bottomY)
      .sort((a, b) => a.x - b.x);

    // X座標の境界
    const xBounds = [0, ...bandVLines.map((l) => l.x), image.width];

    // 列ごとにセルを生成
    for (let colIndex = 0; colIndex < xBounds.length - 1; colIndex++) {
      const leftX = xBounds[colIndex];
      const rightX = xBounds[colIndex + 1];
      const colLabel = String(colIndex + 1); // 1, 2, 3...

      const cellId = `${image.id}-${rowLabel}-${colLabel}`;

      cells.push({
        id: cellId,
        imageId: image.id,
        label: `${rowLabel}-${colLabel}`,
        rect: {
          x: leftX,
          y: topY,
          width: rightX - leftX,
          height: bottomY - topY,
        },
      });
    }
  }

  return cells;
}

// 縦線がどの帯に属するか計算
export function findVerticalLineBounds(
  y: number,
  hLines: HorizontalLine[],
  imageHeight: number,
): { topBoundY: number; bottomBoundY: number } {
  const sortedYs = [
    0,
    ...hLines.map((l) => l.y).sort((a, b) => a - b),
    imageHeight,
  ];

  for (let i = 0; i < sortedYs.length - 1; i++) {
    if (y >= sortedYs[i] && y < sortedYs[i + 1]) {
      return {
        topBoundY: sortedYs[i],
        bottomBoundY: sortedYs[i + 1],
      };
    }
  }

  return {
    topBoundY: sortedYs[sortedYs.length - 2],
    bottomBoundY: sortedYs[sortedYs.length - 1],
  };
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
