import { create } from "zustand";
import type {
  ScoreImage,
  HorizontalLine,
  VerticalLine,
  Cell,
  PlacedCell,
  PaintStroke,
  LabelPosition,
} from "../types";
import {
  calculateCells,
  assignCellLabels,
  getBoundingBox,
} from "../utils/geometry";

type CutDirection = "horizontal" | "vertical";

interface AppState {
  // 画像
  images: ScoreImage[];
  activeImageId: string | null;

  // カット方向
  cutDirection: CutDirection;

  // ラベル位置
  labelPosition: LabelPosition;

  // レイアウト背景オプション
  useBackground: boolean;
  backgroundColor: string;

  // カット線
  horizontalLines: HorizontalLine[];
  verticalLines: VerticalLine[];

  // セル（分割線から導出）
  cells: Cell[];
  nextCellNumberByImage: Record<string, number>; // 画像ごとの次のセル番号

  // レイアウト
  placedCells: PlacedCell[];
  selectedPlacedCellId: string | null;

  // ペン（塗りつぶし）
  paintStrokes: PaintStroke[];
  paintMode: boolean;
  paintColor: string;
  paintWidth: number;

  // チュートリアル完了フラグ
  hasCompletedTutorial: boolean;
  hasCleared: boolean;

  // アクション - 画像
  addImage: (image: ScoreImage) => void;
  removeImage: (imageId: string) => void;
  setActiveImage: (imageId: string | null) => void;

  // アクション - カット方向
  setCutDirection: (direction: CutDirection) => void;

  // アクション - ラベル位置
  cycleLabelPosition: () => void;

  // アクション - 背景オプション
  setUseBackground: (value: boolean) => void;
  setBackgroundColor: (color: string) => void;

  // アクション - 横線
  addHorizontalLine: (line: Omit<HorizontalLine, "id">) => void;
  updateHorizontalLine: (id: string, y: number) => void;
  removeHorizontalLine: (id: string) => void;

  // アクション - 縦線
  addVerticalLine: (line: Omit<VerticalLine, "id">) => void;
  updateVerticalLine: (id: string, x: number) => void;
  removeVerticalLine: (id: string) => void;

  // アクション - 線のリセット
  clearLinesForImage: (imageId: string) => void;

  // アクション - レイアウト
  addPlacedCell: (cellId: string) => void;
  updatePlacedCellPosition: (id: string, x: number, y: number) => void;
  removePlacedCell: (id: string) => void;
  setSelectedPlacedCell: (id: string | null) => void;
  clearLayout: () => void;

  // アクション - ペン（塗りつぶし）
  setPaintMode: (value: boolean) => void;
  setPaintColor: (color: string) => void;
  setPaintWidth: (width: number) => void;
  addPaintStroke: (stroke: Omit<PaintStroke, "id">) => void;
  removePaintStroke: (id: string) => void;
  removePaintStrokesForCell: (placedCellId: string) => void;
  undoLastPaintStroke: () => void;

  // セル再計算
  recalculateCells: () => void;

  // チュートリアル完了
  setHasCompletedTutorial: (value: boolean) => void;
  setHasCleared: (value: boolean) => void;
}

const generateId = () => crypto.randomUUID();

export const useAppStore = create<AppState>()((set, get) => ({
  images: [],
  activeImageId: null,
  cutDirection: "vertical" as CutDirection,
  labelPosition: "top-left" as LabelPosition,
  useBackground: false,
  backgroundColor: "#ffffff",
  horizontalLines: [],
  verticalLines: [],
  cells: [],
  nextCellNumberByImage: {},
  placedCells: [],
  selectedPlacedCellId: null,
  paintStrokes: [],
  paintMode: false,
  paintColor: "#ffffff",
  paintWidth: 10,
  hasCompletedTutorial: false,
  hasCleared: false,

  addImage: (image) => {
    set((state) => ({
      images: [...state.images, image],
      activeImageId: state.activeImageId ?? image.id,
    }));
  },

  removeImage: (imageId) => {
    set((state) => {
      const newImages = state.images.filter((img) => img.id !== imageId);
      const newActiveId =
        state.activeImageId === imageId
          ? (newImages[0]?.id ?? null)
          : state.activeImageId;
      return {
        images: newImages,
        activeImageId: newActiveId,
        horizontalLines: state.horizontalLines.filter(
          (l) => l.imageId !== imageId,
        ),
        verticalLines: state.verticalLines.filter((l) => l.imageId !== imageId),
      };
    });
    get().recalculateCells();
  },

  setActiveImage: (imageId) => {
    set({ activeImageId: imageId });
  },

  setCutDirection: (direction) => {
    set({ cutDirection: direction });
  },

  cycleLabelPosition: () => {
    const positions: LabelPosition[] = ["top-left", "center", "top-right"];
    set((state) => {
      const currentIndex = positions.indexOf(state.labelPosition);
      const nextIndex = (currentIndex + 1) % positions.length;
      return { labelPosition: positions[nextIndex] };
    });
  },

  setUseBackground: (value) => {
    set({ useBackground: value });
  },

  setBackgroundColor: (color) => {
    set({ backgroundColor: color });
  },

  addHorizontalLine: (line) => {
    set((state) => ({
      horizontalLines: [
        ...state.horizontalLines,
        { ...line, id: generateId() },
      ],
    }));
    get().recalculateCells();
  },

  updateHorizontalLine: (id, y) => {
    set((state) => ({
      horizontalLines: state.horizontalLines.map((l) =>
        l.id === id ? { ...l, y } : l,
      ),
    }));
    get().recalculateCells();
  },

  removeHorizontalLine: (id) => {
    set((state) => ({
      horizontalLines: state.horizontalLines.filter((l) => l.id !== id),
    }));
    get().recalculateCells();
  },

  addVerticalLine: (line) => {
    set((state) => ({
      verticalLines: [...state.verticalLines, { ...line, id: generateId() }],
    }));
    get().recalculateCells();
  },

  updateVerticalLine: (id, x) => {
    set((state) => ({
      verticalLines: state.verticalLines.map((l) =>
        l.id === id ? { ...l, x } : l,
      ),
    }));
    get().recalculateCells();
  },

  removeVerticalLine: (id) => {
    set((state) => ({
      verticalLines: state.verticalLines.filter((l) => l.id !== id),
    }));
    get().recalculateCells();
  },

  clearLinesForImage: (imageId) => {
    set((state) => {
      // 該当画像のセルだけ削除
      const remainingCells = state.cells.filter((c) => c.imageId !== imageId);
      // 該当画像の番号をリセット
      const newNextCellNumberByImage = { ...state.nextCellNumberByImage };
      delete newNextCellNumberByImage[imageId];

      return {
        horizontalLines: state.horizontalLines.filter(
          (l) => l.imageId !== imageId,
        ),
        verticalLines: state.verticalLines.filter((l) => l.imageId !== imageId),
        cells: remainingCells,
        nextCellNumberByImage: newNextCellNumberByImage,
      };
    });
    get().recalculateCells();
  },

  addPlacedCell: (cellId) => {
    const state = get();

    // セルと画像を取得
    const cell = state.cells.find((c) => c.id === cellId);
    if (!cell) return;
    const image = state.images.find((img) => img.id === cell.imageId);
    if (!image) return;

    // 新しい配置位置を計算
    let x = 0;
    let y = 0;
    if (state.placedCells.length > 0) {
      const rects = state.placedCells.map((pc) => ({
        x: pc.x,
        y: pc.y,
        width: pc.rect.width,
        height: pc.rect.height,
      }));
      const box = getBoundingBox(rects);
      if (box) {
        // 縦長なら右に、横長なら下に追加
        if (box.height > box.width) {
          x = box.x + box.width;
          y = box.y;
        } else {
          x = box.x;
          y = box.y + box.height;
        }
      }
    }

    set((state) => ({
      placedCells: [
        ...state.placedCells,
        {
          id: generateId(),
          cellId,
          x,
          y,
          label: cell.label,
          rect: { ...cell.rect },
          imageDataUrl: image.dataUrl,
        },
      ],
    }));
  },

  updatePlacedCellPosition: (id, x, y) => {
    set((state) => ({
      placedCells: state.placedCells.map((pc) =>
        pc.id === id ? { ...pc, x, y } : pc,
      ),
    }));
  },

  removePlacedCell: (id) => {
    set((state) => ({
      placedCells: state.placedCells.filter((pc) => pc.id !== id),
      paintStrokes: state.paintStrokes.filter((s) => s.placedCellId !== id),
      selectedPlacedCellId:
        state.selectedPlacedCellId === id ? null : state.selectedPlacedCellId,
    }));
  },

  setSelectedPlacedCell: (id) => {
    set({ selectedPlacedCellId: id });
  },

  clearLayout: () => {
    set({
      placedCells: [],
      selectedPlacedCellId: null,
      paintStrokes: [],
      hasCleared: true,
    });
  },

  setPaintMode: (value) => {
    set({ paintMode: value });
  },

  setPaintColor: (color) => {
    set({ paintColor: color, paintMode: true });
  },

  setPaintWidth: (width) => {
    set({ paintWidth: width, paintMode: true });
  },

  addPaintStroke: (stroke) => {
    set((state) => ({
      paintStrokes: [...state.paintStrokes, { ...stroke, id: generateId() }],
    }));
  },

  removePaintStroke: (id) => {
    set((state) => ({
      paintStrokes: state.paintStrokes.filter((s) => s.id !== id),
    }));
  },

  removePaintStrokesForCell: (placedCellId) => {
    set((state) => ({
      paintStrokes: state.paintStrokes.filter(
        (s) => s.placedCellId !== placedCellId,
      ),
    }));
  },

  undoLastPaintStroke: () => {
    set((state) => ({
      paintStrokes: state.paintStrokes.slice(0, -1),
    }));
  },

  recalculateCells: () => {
    const state = get();
    const newCells: Cell[] = [];
    const newNextCellNumberByImage = { ...state.nextCellNumberByImage };

    for (const image of state.images) {
      const imageHLines = state.horizontalLines
        .filter((l) => l.imageId === image.id)
        .sort((a, b) => a.y - b.y);
      const imageVLines = state.verticalLines.filter(
        (l) => l.imageId === image.id,
      );

      const rawCells = calculateCells(image, imageHLines, imageVLines);
      const existingImageCells = state.cells.filter(
        (c) => c.imageId === image.id,
      );
      const nextNumber = newNextCellNumberByImage[image.id] ?? 1;

      const result = assignCellLabels(rawCells, existingImageCells, nextNumber);
      newCells.push(...result.cells);
      newNextCellNumberByImage[image.id] = result.nextNumber;
    }

    set({
      cells: newCells,
      nextCellNumberByImage: newNextCellNumberByImage,
    });
  },

  setHasCompletedTutorial: (value) => {
    set({ hasCompletedTutorial: value });
  },

  setHasCleared: (value) => {
    set({ hasCleared: value });
  },
}));
