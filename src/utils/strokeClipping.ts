import type { PlacedCell, PaintStroke } from "../types";

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 点を含むタイルを見つける
 * 複数のタイルが重なっている場合は最後（最前面）のものを返す
 */
export function findTileContainingPoint(
  x: number,
  y: number,
  placedCells: PlacedCell[],
): PlacedCell | null {
  // 逆順でチェック（最前面のタイルを優先）
  for (let i = placedCells.length - 1; i >= 0; i--) {
    const cell = placedCells[i];
    if (
      x >= cell.x &&
      x < cell.x + cell.rect.width &&
      y >= cell.y &&
      y < cell.y + cell.rect.height
    ) {
      return cell;
    }
  }
  return null;
}

/**
 * Liang-Barsky線分クリッピングアルゴリズム
 * 線分(p1, p2)を矩形rectでクリップする
 * クリップされた線分を返す。線分が完全に外側の場合はnullを返す
 */
export function clipLineToRect(
  p1: Point,
  p2: Point,
  rect: Rect,
): { p1: Point; p2: Point } | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  let t0 = 0;
  let t1 = 1;

  const p = [-dx, dx, -dy, dy];
  const q = [
    p1.x - rect.x, // left
    rect.x + rect.width - p1.x, // right
    p1.y - rect.y, // top
    rect.y + rect.height - p1.y, // bottom
  ];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      // 線分が境界と平行
      if (q[i] < 0) return null; // 外側にある
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        t0 = Math.max(t0, t);
      } else {
        t1 = Math.min(t1, t);
      }
    }
  }

  if (t0 > t1) return null; // 交差なし

  return {
    p1: {
      x: p1.x + t0 * dx,
      y: p1.y + t0 * dy,
    },
    p2: {
      x: p1.x + t1 * dx,
      y: p1.y + t1 * dy,
    },
  };
}

/**
 * ストロークを各タイルの領域にクリップして分割する
 */
export function splitStrokeByTiles(
  absolutePoints: Point[],
  placedCells: PlacedCell[],
  color: string,
  width: number,
): Omit<PaintStroke, "id">[] {
  if (absolutePoints.length < 2 || placedCells.length === 0) {
    return [];
  }

  // タイルごとのストロークセグメントを収集
  const tileSegments = new Map<string, Point[][]>();

  // 各タイルに対してストロークをクリップ
  for (const cell of placedCells) {
    const rect: Rect = {
      x: cell.x,
      y: cell.y,
      width: cell.rect.width,
      height: cell.rect.height,
    };

    const segments: Point[][] = [];
    let currentSegment: Point[] = [];

    // 各線分をクリップ
    for (let i = 0; i < absolutePoints.length - 1; i++) {
      const p1 = absolutePoints[i];
      const p2 = absolutePoints[i + 1];

      const clipped = clipLineToRect(p1, p2, rect);

      if (clipped) {
        // クリップされた線分をセル相対座標に変換
        const relP1: Point = {
          x: clipped.p1.x - cell.x,
          y: clipped.p1.y - cell.y,
        };
        const relP2: Point = {
          x: clipped.p2.x - cell.x,
          y: clipped.p2.y - cell.y,
        };

        if (currentSegment.length === 0) {
          // 新しいセグメント開始
          currentSegment.push(relP1, relP2);
        } else {
          // 前の点と接続しているか確認
          const lastPoint = currentSegment[currentSegment.length - 1];
          const epsilon = 0.001;
          if (
            Math.abs(lastPoint.x - relP1.x) < epsilon &&
            Math.abs(lastPoint.y - relP1.y) < epsilon
          ) {
            // 接続している - 続けて追加
            currentSegment.push(relP2);
          } else {
            // 接続していない - 新しいセグメント
            if (currentSegment.length >= 2) {
              segments.push(currentSegment);
            }
            currentSegment = [relP1, relP2];
          }
        }
      } else {
        // この線分はタイル外 - 現在のセグメントを終了
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    }

    // 最後のセグメントを追加
    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }

    if (segments.length > 0) {
      tileSegments.set(cell.id, segments);
    }
  }

  // PaintStroke配列に変換
  const result: Omit<PaintStroke, "id">[] = [];
  for (const [cellId, segments] of tileSegments) {
    for (const points of segments) {
      if (points.length >= 2) {
        result.push({
          placedCellId: cellId,
          points,
          color,
          width,
        });
      }
    }
  }

  return result;
}
