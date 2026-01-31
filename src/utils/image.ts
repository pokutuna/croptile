import type { Cell, PlacedCell, ScoreImage } from "../types";
import { getBoundingBox } from "./geometry";

// 画像を読み込んでScoreImageオブジェクトを作成
export async function loadImage(file: File): Promise<ScoreImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// セルを画像から切り出してCanvasに描画
export function drawCellToCanvas(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cell: Cell,
  destX: number,
  destY: number,
): void {
  ctx.drawImage(
    image,
    cell.rect.x,
    cell.rect.y,
    cell.rect.width,
    cell.rect.height,
    destX,
    destY,
    cell.rect.width,
    cell.rect.height,
  );
}

// 配置されたセルをPNG画像として出力
export async function exportToPng(
  placedCells: PlacedCell[],
  cells: Cell[],
  images: ScoreImage[],
  backgroundColor: string | null = null,
): Promise<Blob | null> {
  if (placedCells.length === 0) return null;

  // 配置されたセルの情報を取得
  const placedCellsWithInfo = placedCells
    .map((pc) => {
      const cell = cells.find((c) => c.id === pc.cellId);
      if (!cell) return null;
      return {
        ...pc,
        cell,
        rect: {
          x: pc.x,
          y: pc.y,
          width: cell.rect.width,
          height: cell.rect.height,
        },
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    cellId: string;
    x: number;
    y: number;
    cell: Cell;
    rect: { x: number; y: number; width: number; height: number };
  }>;

  // バウンディングボックスを計算
  const boundingBox = getBoundingBox(placedCellsWithInfo.map((p) => p.rect));
  if (!boundingBox) return null;

  // Canvasを作成
  const canvas = document.createElement("canvas");
  canvas.width = boundingBox.width;
  canvas.height = boundingBox.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 背景色を塗る（オプション）
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 画像をロード
  const imageMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const htmlImg = new Image();
          htmlImg.onload = () => {
            imageMap.set(img.id, htmlImg);
            resolve();
          };
          htmlImg.src = img.dataUrl;
        }),
    ),
  );

  // 各セルを描画
  for (const placedInfo of placedCellsWithInfo) {
    const htmlImg = imageMap.get(placedInfo.cell.imageId);
    if (!htmlImg) continue;

    drawCellToCanvas(
      ctx,
      htmlImg,
      placedInfo.cell,
      placedInfo.x - boundingBox.x,
      placedInfo.y - boundingBox.y,
    );
  }

  // Blobとして出力
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
