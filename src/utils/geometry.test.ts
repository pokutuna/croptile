import { describe, it, expect } from "vitest";
import {
  calculateCells,
  findCellBoundsAtPoint,
  isPointInRect,
  doRectsIntersect,
  getBoundingBox,
  assignCellLabels,
} from "./geometry";
import type { ScoreImage, HorizontalLine, VerticalLine } from "../types";

// テスト用のヘルパー
const createImage = (
  id: string,
  width: number,
  height: number,
): ScoreImage => ({
  id,
  name: "test.png",
  dataUrl: "",
  width,
  height,
});

const createHLine = (
  id: string,
  imageId: string,
  y: number,
  leftBoundX = 0,
  rightBoundX = 1000,
): HorizontalLine => ({
  id,
  imageId,
  y,
  leftBoundX,
  rightBoundX,
});

const createVLine = (
  id: string,
  imageId: string,
  x: number,
  topBoundY = 0,
  bottomBoundY = 1000,
): VerticalLine => ({
  id,
  imageId,
  x,
  topBoundY,
  bottomBoundY,
});

describe("calculateCells", () => {
  it("線がない場合、画像全体が1つのセルになる", () => {
    const image = createImage("img1", 800, 600);
    const cells = calculateCells(image, [], []);

    expect(cells).toHaveLength(1);
    expect(cells[0].rect).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  it("横線1本で2つのセルに分割される", () => {
    const image = createImage("img1", 800, 600);
    const hLines = [createHLine("h1", "img1", 300)];
    const cells = calculateCells(image, hLines, []);

    expect(cells).toHaveLength(2);
    expect(cells[0].rect).toEqual({ x: 0, y: 0, width: 800, height: 300 });
    expect(cells[1].rect).toEqual({ x: 0, y: 300, width: 800, height: 300 });
  });

  it("縦線1本で2つのセルに分割される", () => {
    const image = createImage("img1", 800, 600);
    const vLines = [createVLine("v1", "img1", 400)];
    const cells = calculateCells(image, [], vLines);

    expect(cells).toHaveLength(2);
    expect(cells[0].rect).toEqual({ x: 0, y: 0, width: 400, height: 600 });
    expect(cells[1].rect).toEqual({ x: 400, y: 0, width: 400, height: 600 });
  });

  it("横線1本と縦線1本で4つのセルに分割される", () => {
    const image = createImage("img1", 800, 600);
    const hLines = [createHLine("h1", "img1", 300)];
    const vLines = [createVLine("v1", "img1", 400)];
    const cells = calculateCells(image, hLines, vLines);

    expect(cells).toHaveLength(4);
    // 左上
    expect(cells[0].rect).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    // 右上
    expect(cells[1].rect).toEqual({ x: 400, y: 0, width: 400, height: 300 });
    // 左下
    expect(cells[2].rect).toEqual({ x: 0, y: 300, width: 400, height: 300 });
    // 右下
    expect(cells[3].rect).toEqual({ x: 400, y: 300, width: 400, height: 300 });
  });

  it("縦線の範囲が横線で制限される場合、部分的に分割される", () => {
    const image = createImage("img1", 800, 600);
    // 横線で上下に分割
    const hLines = [createHLine("h1", "img1", 300)];
    // 縦線は上半分 (0-300) のみに適用される
    const vLines = [createVLine("v1", "img1", 400, 0, 300)];
    const cells = calculateCells(image, hLines, vLines);

    expect(cells).toHaveLength(3);
    // 上部は2分割
    expect(cells[0].rect).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    expect(cells[1].rect).toEqual({ x: 400, y: 0, width: 400, height: 300 });
    // 下部は分割なし
    expect(cells[2].rect).toEqual({ x: 0, y: 300, width: 800, height: 300 });
  });

  it("横線の範囲が縦線で制限される場合、部分的に分割される", () => {
    const image = createImage("img1", 800, 600);
    // 縦線で左右に分割
    const vLines = [createVLine("v1", "img1", 400)];
    // 横線は左半分 (0-400) のみに適用される
    const hLines = [createHLine("h1", "img1", 300, 0, 400)];
    const cells = calculateCells(image, hLines, vLines);

    expect(cells).toHaveLength(3);
    // 左上
    expect(cells[0].rect).toEqual({ x: 0, y: 0, width: 400, height: 300 });
    // 左下
    expect(cells[1].rect).toEqual({ x: 0, y: 300, width: 400, height: 300 });
    // 右部は分割なし
    expect(cells[2].rect).toEqual({ x: 400, y: 0, width: 400, height: 600 });
  });

  it("複数の横線で複数の帯に分割される", () => {
    const image = createImage("img1", 800, 600);
    const hLines = [
      createHLine("h1", "img1", 200),
      createHLine("h2", "img1", 400),
    ];
    const cells = calculateCells(image, hLines, []);

    expect(cells).toHaveLength(3);
    expect(cells[0].rect).toEqual({ x: 0, y: 0, width: 800, height: 200 });
    expect(cells[1].rect).toEqual({ x: 0, y: 200, width: 800, height: 200 });
    expect(cells[2].rect).toEqual({ x: 0, y: 400, width: 800, height: 200 });
  });
});

describe("findCellBoundsAtPoint", () => {
  it("線がない場合、画像全体が返される", () => {
    const bounds = findCellBoundsAtPoint(100, 100, [], [], 800, 600);
    expect(bounds).toEqual({ leftX: 0, topY: 0, rightX: 800, bottomY: 600 });
  });

  it("横線がある場合、クリック位置を含む帯が返される", () => {
    const hLines = [createHLine("h1", "img1", 300)];
    // 上半分をクリック
    const boundsTop = findCellBoundsAtPoint(100, 100, hLines, [], 800, 600);
    expect(boundsTop).toEqual({ leftX: 0, topY: 0, rightX: 800, bottomY: 300 });

    // 下半分をクリック
    const boundsBottom = findCellBoundsAtPoint(100, 400, hLines, [], 800, 600);
    expect(boundsBottom).toEqual({
      leftX: 0,
      topY: 300,
      rightX: 800,
      bottomY: 600,
    });
  });

  it("縦線がある場合、クリック位置を含む列が返される", () => {
    const vLines = [createVLine("v1", "img1", 400)];
    // 左半分をクリック
    const boundsLeft = findCellBoundsAtPoint(100, 100, [], vLines, 800, 600);
    expect(boundsLeft).toEqual({
      leftX: 0,
      topY: 0,
      rightX: 400,
      bottomY: 600,
    });

    // 右半分をクリック
    const boundsRight = findCellBoundsAtPoint(500, 100, [], vLines, 800, 600);
    expect(boundsRight).toEqual({
      leftX: 400,
      topY: 0,
      rightX: 800,
      bottomY: 600,
    });
  });
});

describe("isPointInRect", () => {
  const rect = { x: 100, y: 100, width: 200, height: 150 };

  it("矩形内の点に対してtrueを返す", () => {
    expect(isPointInRect(150, 150, rect)).toBe(true);
    expect(isPointInRect(100, 100, rect)).toBe(true); // 左上角
    expect(isPointInRect(300, 250, rect)).toBe(true); // 右下角
  });

  it("矩形外の点に対してfalseを返す", () => {
    expect(isPointInRect(50, 150, rect)).toBe(false); // 左外
    expect(isPointInRect(350, 150, rect)).toBe(false); // 右外
    expect(isPointInRect(150, 50, rect)).toBe(false); // 上外
    expect(isPointInRect(150, 300, rect)).toBe(false); // 下外
  });
});

describe("doRectsIntersect", () => {
  const baseRect = { x: 100, y: 100, width: 200, height: 150 };

  it("重なっている矩形に対してtrueを返す", () => {
    const overlapping = { x: 150, y: 150, width: 100, height: 100 };
    expect(doRectsIntersect(baseRect, overlapping)).toBe(true);
  });

  it("辺が接している矩形に対してtrueを返す", () => {
    const touching = { x: 300, y: 100, width: 100, height: 150 };
    expect(doRectsIntersect(baseRect, touching)).toBe(true);
  });

  it("離れている矩形に対してfalseを返す", () => {
    const separate = { x: 400, y: 100, width: 100, height: 150 };
    expect(doRectsIntersect(baseRect, separate)).toBe(false);
  });

  it("完全に含まれる矩形に対してtrueを返す", () => {
    const contained = { x: 150, y: 150, width: 50, height: 50 };
    expect(doRectsIntersect(baseRect, contained)).toBe(true);
  });
});

describe("getBoundingBox", () => {
  it("空配列に対してnullを返す", () => {
    expect(getBoundingBox([])).toBeNull();
  });

  it("1つの矩形に対してその矩形を返す", () => {
    const rect = { x: 100, y: 100, width: 200, height: 150 };
    expect(getBoundingBox([rect])).toEqual(rect);
  });

  it("複数の矩形に対して正しいバウンディングボックスを返す", () => {
    const rects = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 200, y: 150, width: 100, height: 100 },
    ];
    expect(getBoundingBox(rects)).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 250,
    });
  });

  it("負の座標を持つ矩形も正しく処理する", () => {
    const rects = [
      { x: -50, y: -50, width: 100, height: 100 },
      { x: 100, y: 100, width: 100, height: 100 },
    ];
    expect(getBoundingBox(rects)).toEqual({
      x: -50,
      y: -50,
      width: 250,
      height: 250,
    });
  });
});

describe("assignCellLabels", () => {
  const createCell = (
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => ({
    id: `img1-${label}`,
    imageId: "img1",
    label,
    rect: { x, y, width, height },
  });

  it("既存セルがない場合、1から順番にラベルを割り当てる", () => {
    const rawCells = [
      createCell("", 0, 0, 100, 100),
      createCell("", 100, 0, 100, 100),
    ];
    const result = assignCellLabels(rawCells, [], 1);

    expect(result.cells).toHaveLength(2);
    expect(result.cells[0].label).toBe("1");
    expect(result.cells[1].label).toBe("2");
    expect(result.nextNumber).toBe(3);
  });

  it("完全一致するセルがあれば、そのラベルを継承する", () => {
    const rawCells = [createCell("", 0, 0, 100, 100)];
    const existingCells = [createCell("5", 0, 0, 100, 100)];
    const result = assignCellLabels(rawCells, existingCells, 10);

    expect(result.cells[0].label).toBe("5");
    expect(result.nextNumber).toBe(10); // 新規割り当てなし
  });

  it("分割時、親セルのラベルを継承する", () => {
    // 既存: 大きなセル (0,0)-(200,100) ラベル "3"
    // 新規: 左半分 (0,0)-(100,100), 右半分 (100,0)-(200,100)
    const existingCells = [createCell("3", 0, 0, 200, 100)];
    const rawCells = [
      createCell("", 0, 0, 100, 100),
      createCell("", 100, 0, 100, 100),
    ];
    const result = assignCellLabels(rawCells, existingCells, 5);

    // 最初の子セルが "3" を継承、2番目は新規番号
    expect(result.cells[0].label).toBe("3");
    expect(result.cells[1].label).toBe("5");
    expect(result.nextNumber).toBe(6);
  });

  it("既に使われたラベルは継承しない", () => {
    // 2つの新セルが同じ親を持つ場合、最初のセルだけがラベルを継承
    const existingCells = [createCell("3", 0, 0, 200, 200)];
    const rawCells = [
      createCell("", 0, 0, 100, 100),
      createCell("", 100, 0, 100, 100),
      createCell("", 0, 100, 100, 100),
      createCell("", 100, 100, 100, 100),
    ];
    const result = assignCellLabels(rawCells, existingCells, 10);

    expect(result.cells[0].label).toBe("3"); // 継承
    expect(result.cells[1].label).toBe("10"); // 新規
    expect(result.cells[2].label).toBe("11"); // 新規
    expect(result.cells[3].label).toBe("12"); // 新規
    expect(result.nextNumber).toBe(13);
  });

  it("複数の既存セルから適切なラベルを継承する", () => {
    // 既存: 2つのセル
    const existingCells = [
      createCell("1", 0, 0, 100, 100),
      createCell("2", 100, 0, 100, 100),
    ];
    // 新規: 同じ2つのセル（変更なし）
    const rawCells = [
      createCell("", 0, 0, 100, 100),
      createCell("", 100, 0, 100, 100),
    ];
    const result = assignCellLabels(rawCells, existingCells, 5);

    expect(result.cells[0].label).toBe("1");
    expect(result.cells[1].label).toBe("2");
    expect(result.nextNumber).toBe(5); // 新規割り当てなし
  });

  it("nextNumber から新しいラベルが割り当てられる", () => {
    const rawCells = [createCell("", 0, 0, 100, 100)];
    const result = assignCellLabels(rawCells, [], 42);

    expect(result.cells[0].label).toBe("42");
    expect(result.nextNumber).toBe(43);
  });
});
