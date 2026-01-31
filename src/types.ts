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

// レイアウト上の配置
export interface PlacedCell {
  id: string;
  cellId: string;
  x: number;
  y: number;
}

// カットモードの種類
export type CutMode = "horizontal" | "vertical" | null;

// ドラッグ中の線の情報
export interface DraggingLine {
  type: "horizontal" | "vertical";
  id: string;
}
