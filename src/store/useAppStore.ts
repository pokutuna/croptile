import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ScoreImage,
  HorizontalLine,
  VerticalLine,
  Cell,
  PlacedCell,
} from "../types";
import { calculateCells } from "../utils/geometry";

type CutDirection = "horizontal" | "vertical";

interface AppState {
  // 画像
  images: ScoreImage[];
  activeImageId: string | null;

  // カット方向
  cutDirection: CutDirection;

  // レイアウト背景オプション
  useBackground: boolean;
  backgroundColor: string;

  // カット線
  horizontalLines: HorizontalLine[];
  verticalLines: VerticalLine[];

  // セル（分割線から導出）
  cells: Cell[];

  // レイアウト
  placedCells: PlacedCell[];
  selectedPlacedCellId: string | null;

  // アクション - 画像
  addImage: (image: ScoreImage) => void;
  removeImage: (imageId: string) => void;
  setActiveImage: (imageId: string | null) => void;

  // アクション - カット方向
  setCutDirection: (direction: CutDirection) => void;

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

  // セル再計算
  recalculateCells: () => void;
}

const generateId = () => crypto.randomUUID();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      images: [],
      activeImageId: null,
      cutDirection: "horizontal" as CutDirection,
      useBackground: false,
      backgroundColor: "#ffffff",
      horizontalLines: [],
      verticalLines: [],
      cells: [],
      placedCells: [],
      selectedPlacedCellId: null,

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
            verticalLines: state.verticalLines.filter(
              (l) => l.imageId !== imageId,
            ),
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
          verticalLines: [
            ...state.verticalLines,
            { ...line, id: generateId() },
          ],
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
        set((state) => ({
          horizontalLines: state.horizontalLines.filter(
            (l) => l.imageId !== imageId,
          ),
          verticalLines: state.verticalLines.filter(
            (l) => l.imageId !== imageId,
          ),
        }));
        get().recalculateCells();
      },

      addPlacedCell: (cellId) => {
        const state = get();
        // 既に配置済みかチェック
        if (state.placedCells.some((pc) => pc.cellId === cellId)) {
          return;
        }

        // 新しい配置位置を計算（既存セルの右側に隙間なく配置）
        let x = 0;
        let y = 0;
        if (state.placedCells.length > 0) {
          const cell = state.cells.find((c) => c.id === cellId);
          if (cell) {
            // 最後に配置したセルの右側に配置
            const lastPlaced = state.placedCells[state.placedCells.length - 1];
            const lastCell = state.cells.find(
              (c) => c.id === lastPlaced.cellId,
            );
            if (lastCell) {
              x = lastPlaced.x + lastCell.rect.width;
              y = lastPlaced.y;
            }
          }
        }

        set((state) => ({
          placedCells: [
            ...state.placedCells,
            { id: generateId(), cellId, x, y },
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
          selectedPlacedCellId:
            state.selectedPlacedCellId === id
              ? null
              : state.selectedPlacedCellId,
        }));
      },

      setSelectedPlacedCell: (id) => {
        set({ selectedPlacedCellId: id });
      },

      clearLayout: () => {
        set({ placedCells: [], selectedPlacedCellId: null });
      },

      recalculateCells: () => {
        const state = get();
        const newCells: Cell[] = [];

        for (const image of state.images) {
          const imageHLines = state.horizontalLines
            .filter((l) => l.imageId === image.id)
            .sort((a, b) => a.y - b.y);
          const imageVLines = state.verticalLines.filter(
            (l) => l.imageId === image.id,
          );

          const cells = calculateCells(image, imageHLines, imageVLines);
          newCells.push(...cells);
        }

        // 削除されたセルをplacedCellsから除去
        const validCellIds = new Set(newCells.map((c) => c.id));
        set((state) => ({
          cells: newCells,
          placedCells: state.placedCells.filter((pc) =>
            validCellIds.has(pc.cellId),
          ),
        }));
      },
    }),
    {
      name: "scorecutter-storage",
      partialize: (state) => ({
        images: state.images,
        activeImageId: state.activeImageId,
        horizontalLines: state.horizontalLines,
        verticalLines: state.verticalLines,
        placedCells: state.placedCells,
      }),
    },
  ),
);
