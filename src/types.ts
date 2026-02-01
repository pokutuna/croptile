// 楽譜画像
export interface ScoreImage {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

// 水平カット線
export interface HorizontalLine {
  id: string;
  imageId: string;
  y: number;
  leftBoundX: number;
  rightBoundX: number;
}

// 垂直カット線
export interface VerticalLine {
  id: string;
  imageId: string;
  x: number;
  topBoundY: number;
  bottomBoundY: number;
}

// セル（楽譜片）
export interface Cell {
  id: string;
  imageId: string;
  label: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// レイアウト上の配置（セルのコピーを保持）
export interface PlacedCell {
  id: string;
  cellId: string; // 元のセルID（重複チェック用）
  x: number;
  y: number;
  // コピーされたセル情報
  label: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  imageDataUrl: string;
}

// ペンストローク（線の軌跡）- セルに紐づく
export interface PaintStroke {
  id: string;
  placedCellId: string; // 紐づくPlacedCellのID
  points: { x: number; y: number }[]; // セル内の相対座標
  color: string;
  width: number;
}

// カットモードの種類
export type CropDirection = "horizontal" | "vertical";
export type CropMode = CropDirection | null;
// 互換性のため別名をエクスポート
export type CutMode = CropMode;

// ドラッグ中の線の情報
export interface DraggingLine {
  type: CropDirection;
  id: string;
}

// 矩形
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ドラッグ状態
export interface DragState {
  placedCellId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

// ペイント中の状態
export interface PaintingState {
  placedCellId: string;
  points: { x: number; y: number }[];
}

// ガイドライン
export interface GuideLine {
  type: "horizontal" | "vertical";
  position: number;
}

// ラベル位置
export type LabelPosition =
  | "top-left"
  | "top-right"
  | "center"
  | "bottom-left"
  | "bottom-right";
