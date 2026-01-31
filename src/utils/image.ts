import type { PlacedCell, ScoreImage, PaintStroke } from "../types";
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

// 配置されたセルをPNG画像として出力
export async function exportToPng(
  placedCells: PlacedCell[],
  backgroundColor: string | null = null,
  paintStrokes: PaintStroke[] = [],
): Promise<Blob | null> {
  if (placedCells.length === 0) return null;

  // バウンディングボックスを計算
  const rects = placedCells.map((pc) => ({
    x: pc.x,
    y: pc.y,
    width: pc.rect.width,
    height: pc.rect.height,
  }));
  const boundingBox = getBoundingBox(rects);
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

  // 各セルの画像をロードして描画
  for (const pc of placedCells) {
    const htmlImg = await new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = pc.imageDataUrl;
    });

    ctx.drawImage(
      htmlImg,
      pc.rect.x,
      pc.rect.y,
      pc.rect.width,
      pc.rect.height,
      pc.x - boundingBox.x,
      pc.y - boundingBox.y,
      pc.rect.width,
      pc.rect.height,
    );
  }

  // ペンストロークを描画
  for (const stroke of paintStrokes) {
    const pc = placedCells.find((p) => p.id === stroke.placedCellId);
    if (!pc || stroke.points.length < 2) continue;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(
      pc.x + stroke.points[0].x - boundingBox.x,
      pc.y + stroke.points[0].y - boundingBox.y,
    );
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(
        pc.x + stroke.points[i].x - boundingBox.x,
        pc.y + stroke.points[i].y - boundingBox.y,
      );
    }
    ctx.stroke();
  }

  // Blobとして出力
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
