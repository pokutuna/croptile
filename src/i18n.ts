const messages = {
  en: {
    // Toolbar
    tagline: "Split. Arrange. Done.",
    download: "Save",
    saveAs: "Save As...",

    // CutArea
    cut: "Crop",
    cutVertical: "Split Vertically",
    cutHorizontal: "Split Horizontally",
    reset: "Reset",
    page: "Page",
    addImage: "Add Image",
    deletePage: "Delete Page",
    deletePageConfirm: "Delete Page {n}?",
    addImagePlaceholder: "Add an image",
    deleteAllLinesForPage: "Delete all lines for this page",

    // CutCanvas
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset to 100%",
    fitToView: "Fit to View",
    fitToWidth: "Fit to Width",
    fitToHeight: "Fit to Height",
    clickToAddHorizontalLine: "Click to add horizontal cut line",
    clickToAddVerticalLine: "Click to add vertical cut line",
    clickToEditZoom: "Click to edit, scroll to adjust",
    labelPosition: "Label position",

    // LineOverlay
    delete: "Delete",

    // LayoutArea
    layout: "Layout",
    clear: "Clear",
    clearConfirm: "Clear all placed items?",
    bgColor: "Background",
    paintMode: "Paint",
    paintWidth: "Width",
    moveMode: "Move",
    penMode: "Pen",

    // PlacedCell
    removeFromLayout: "Remove from layout",

    // ImageUploader
    dropOrClickToSelect: "Drop image or click to select",
    supportedFormats: "PNG, JPEG supported",

    // LayoutCanvas
    fillBackground: "Fill gaps",
    clickToAddToLayout: "Click labels on the left image to add",

    // Tutorial
    tutorialStep1: "Load an image to the Crop panel on the left",
    tutorialStep2: "Draw lines to split the image into sections",
    tutorialStep3Pre: "Hover over a tile and click",
    tutorialStep3Post: "to place it here",
    tutorialStep4: "Arrange the sections by dragging",
    tutorialStep4Sub: "Use the pen tool to erase or draw",
    tutorialStep5: "Download your result",
    tutorialStep6Pre: "Click",
    tutorialStep6Post: "to start a new layout",
    clickToAddVerticalGuide: "Click to add/remove vertical guide",
    clickToAddHorizontalGuide: "Click to add/remove horizontal guide",
    removeGuide: "Remove guide",
    customColor: "Custom color",
    clickToDelete: "Click to delete",
    clickToAddCell: "Click to add to layout",
    addCell: "+Add",

    // Background presets
    white: "White",
    lightGray: "Light Gray",
  },
  ja: {
    // Toolbar
    tagline: "切って、並べて、完成",
    download: "保存",
    saveAs: "名前を付けて保存...",

    // CutArea
    cut: "カット",
    cutVertical: "縦に切る",
    cutHorizontal: "横に切る",
    reset: "リセット",
    page: "ページ",
    addImage: "画像追加",
    deletePage: "ページを削除",
    deletePageConfirm: "ページ {n} を削除しますか?",
    addImagePlaceholder: "画像を追加してください",
    deleteAllLinesForPage: "このページの分割線をすべて削除",

    // CutCanvas
    zoomIn: "拡大",
    zoomOut: "縮小",
    resetZoom: "100%にリセット",
    fitToView: "全体を表示",
    fitToWidth: "横幅に合わせる",
    fitToHeight: "高さに合わせる",
    clickToAddHorizontalLine: "クリックで横カット線を追加",
    clickToAddVerticalLine: "クリックで縦カット線を追加",
    clickToEditZoom: "クリックで編集、スクロールで調整",
    labelPosition: "ラベル位置",

    // LineOverlay
    delete: "削除",

    // LayoutArea
    layout: "レイアウト",
    clear: "クリア",
    clearConfirm: "配置をすべてクリアしますか?",
    bgColor: "背景色",
    paintMode: "ペン",
    paintWidth: "太さ",
    moveMode: "移動",
    penMode: "ペン",

    // PlacedCell
    removeFromLayout: "レイアウトから削除",

    // ImageUploader
    dropOrClickToSelect: "画像をドロップ、またはクリックして選択",
    supportedFormats: "PNG, JPEG対応",

    // LayoutCanvas
    fillBackground: "余白を塗る",
    clickToAddToLayout: "左の画像上のラベルをクリックして追加",

    // Tutorial
    tutorialStep1: "左のカットパネルに画像を読み込む",
    tutorialStep2: "分割線を引いてセクションに分ける",
    tutorialStep3Pre: "タイルにホバーして",
    tutorialStep3Post: "をクリック",
    tutorialStep4: "ドラッグして配置を調整",
    tutorialStep4Sub: "ペンツールで消したり書き込んだりできます",
    tutorialStep5: "ダウンロードして保存",
    tutorialStep6Pre: "",
    tutorialStep6Post: "で新たなタイルを配置",
    clickToAddVerticalGuide: "クリックで縦ガイド線を追加/削除",
    clickToAddHorizontalGuide: "クリックで横ガイド線を追加/削除",
    removeGuide: "ガイドを削除",
    customColor: "カスタム色",
    clickToDelete: "クリックで削除",
    clickToAddCell: "クリックでレイアウトに追加",
    addCell: "+追加",

    // Background presets
    white: "白",
    lightGray: "薄いグレー",
  },
} as const;

export type Locale = keyof typeof messages;
type MessageKey = keyof (typeof messages)["en"];

const detectLocale = (): Locale => {
  const lang = navigator.language.slice(0, 2);
  return lang === "ja" ? "ja" : "en";
};

let currentLocale: Locale = detectLocale();
const listeners: Set<() => void> = new Set();

export const t = (
  key: MessageKey,
  params?: Record<string, string | number>,
): string => {
  let message: string = messages[currentLocale][key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      message = message.replace(`{${k}}`, String(v));
    }
  }
  return message;
};

export const setLocale = (locale: Locale) => {
  currentLocale = locale;
  listeners.forEach((fn) => fn());
};

export const getLocale = (): Locale => currentLocale;

export const subscribeLocale = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
