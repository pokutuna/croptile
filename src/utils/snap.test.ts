import { describe, it, expect } from "vitest";
import { calculateSnap } from "./snap";

describe("calculateSnap", () => {
  const movingRect = { x: 0, y: 0, width: 100, height: 100 };

  it("ターゲットがない場合、現在位置をそのまま返す", () => {
    const result = calculateSnap(movingRect, [], 50, 50);
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
    expect(result.snappedX).toBe(false);
    expect(result.snappedY).toBe(false);
    expect(result.guideLines).toHaveLength(0);
  });

  describe("キャンバス原点へのスナップ", () => {
    it("左辺が0に近いとき、x=0にスナップする", () => {
      const result = calculateSnap(movingRect, [], 5, 50);
      expect(result.x).toBe(0);
      expect(result.snappedX).toBe(true);
    });

    it("上辺が0に近いとき、y=0にスナップする", () => {
      const result = calculateSnap(movingRect, [], 50, 5);
      expect(result.y).toBe(0);
      expect(result.snappedY).toBe(true);
    });

    it("左辺と上辺が両方0に近いとき、両方スナップする", () => {
      const result = calculateSnap(movingRect, [], 3, 5);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.snappedX).toBe(true);
      expect(result.snappedY).toBe(true);
    });
  });

  describe("X軸のスナップ", () => {
    it("左辺-左辺でスナップする", () => {
      const target = { x: 200, y: 0, width: 100, height: 100 };
      // 移動中の矩形の左辺 (205) がターゲットの左辺 (200) に近い
      const result = calculateSnap(movingRect, [target], 205, 0);
      expect(result.x).toBe(200);
      expect(result.snappedX).toBe(true);
    });

    it("右辺-右辺でスナップする", () => {
      const target = { x: 200, y: 0, width: 100, height: 100 };
      // 移動中の矩形の右辺 (105) がターゲットの右辺 (300) に近い
      // currentX = 195 → 右辺 = 295, ターゲット右辺 = 300
      const result = calculateSnap(movingRect, [target], 195, 0);
      expect(result.x).toBe(200); // 300 - 100 = 200
      expect(result.snappedX).toBe(true);
    });

    it("左辺-右辺でスナップする (隣接配置)", () => {
      const target = { x: 0, y: 0, width: 100, height: 100 };
      // 移動中の矩形の左辺がターゲットの右辺 (100) に近い
      const result = calculateSnap(movingRect, [target], 105, 0);
      expect(result.x).toBe(100);
      expect(result.snappedX).toBe(true);
    });

    it("右辺-左辺でスナップする (隣接配置)", () => {
      const target = { x: 200, y: 0, width: 100, height: 100 };
      // 移動中の矩形の右辺 (195) がターゲットの左辺 (200) に近い
      const result = calculateSnap(movingRect, [target], 95, 0);
      expect(result.x).toBe(100); // 200 - 100 = 100
      expect(result.snappedX).toBe(true);
    });

    it("閾値を超えるとスナップしない", () => {
      const target = { x: 200, y: 0, width: 100, height: 100 };
      // 移動中の矩形の左辺 (50) がターゲットの左辺 (200) から離れている
      const result = calculateSnap(movingRect, [target], 50, 0);
      expect(result.x).toBe(50);
      expect(result.snappedX).toBe(false);
    });
  });

  describe("Y軸のスナップ", () => {
    it("上辺-上辺でスナップする", () => {
      const target = { x: 0, y: 200, width: 100, height: 100 };
      const result = calculateSnap(movingRect, [target], 0, 205);
      expect(result.y).toBe(200);
      expect(result.snappedY).toBe(true);
    });

    it("下辺-下辺でスナップする", () => {
      const target = { x: 0, y: 200, width: 100, height: 100 };
      // currentY = 195 → 下辺 = 295, ターゲット下辺 = 300
      const result = calculateSnap(movingRect, [target], 0, 195);
      expect(result.y).toBe(200); // 300 - 100 = 200
      expect(result.snappedY).toBe(true);
    });

    it("上辺-下辺でスナップする (隣接配置)", () => {
      const target = { x: 0, y: 0, width: 100, height: 100 };
      // 移動中の矩形の上辺がターゲットの下辺 (100) に近い
      const result = calculateSnap(movingRect, [target], 0, 105);
      expect(result.y).toBe(100);
      expect(result.snappedY).toBe(true);
    });

    it("下辺-上辺でスナップする (隣接配置)", () => {
      const target = { x: 0, y: 200, width: 100, height: 100 };
      // 移動中の矩形の下辺 (195) がターゲットの上辺 (200) に近い
      const result = calculateSnap(movingRect, [target], 0, 95);
      expect(result.y).toBe(100); // 200 - 100 = 100
      expect(result.snappedY).toBe(true);
    });
  });

  describe("複数のターゲット", () => {
    it("最も近いターゲットにスナップする", () => {
      const targets = [
        { x: 200, y: 0, width: 100, height: 100 },
        { x: 150, y: 0, width: 40, height: 100 },
      ];
      // currentX = 105 → 左辺 = 105
      // target1 の左辺 = 200 (差 95)
      // target2 の右辺 = 190 (差 85)
      // target2 の左辺 = 150 (差 45)
      // 最も近いのは target2 の左辺
      const result = calculateSnap(movingRect, targets, 145, 0);
      expect(result.x).toBe(150);
      expect(result.snappedX).toBe(true);
    });
  });

  describe("ガイドライン生成", () => {
    it("Xスナップ時に縦のガイドラインが2本生成される", () => {
      const target = { x: 200, y: 0, width: 100, height: 100 };
      const result = calculateSnap(movingRect, [target], 205, 0);

      const verticalGuides = result.guideLines.filter(
        (g) => g.type === "vertical",
      );
      expect(verticalGuides).toHaveLength(2);
      expect(verticalGuides[0].position).toBe(200); // 左辺
      expect(verticalGuides[1].position).toBe(300); // 右辺
    });

    it("Yスナップ時に横のガイドラインが2本生成される", () => {
      const target = { x: 0, y: 200, width: 100, height: 100 };
      const result = calculateSnap(movingRect, [target], 0, 205);

      const horizontalGuides = result.guideLines.filter(
        (g) => g.type === "horizontal",
      );
      expect(horizontalGuides).toHaveLength(2);
      expect(horizontalGuides[0].position).toBe(200); // 上辺
      expect(horizontalGuides[1].position).toBe(300); // 下辺
    });

    it("XとY両方スナップ時に4本のガイドラインが生成される", () => {
      const target = { x: 200, y: 200, width: 100, height: 100 };
      const result = calculateSnap(movingRect, [target], 205, 205);

      expect(result.guideLines).toHaveLength(4);
      expect(result.snappedX).toBe(true);
      expect(result.snappedY).toBe(true);
    });
  });
});
