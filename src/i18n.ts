const messages = {
  en: {
    // Toolbar
    export: "Export",

    // CutArea
    cut: "Cut",
    cutVertical: "Cut Vertical",
    cutHorizontal: "Cut Horizontal",
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
    clickToAddHorizontalLine: "Click to add horizontal cut line",
    clickToAddVerticalLine: "Click to add vertical cut line",

    // LineOverlay
    delete: "Delete",

    // LayoutArea
    layout: "Layout",
    clear: "Clear",
    clearConfirm: "Clear all placed items?",
    bgColor: "Background",
    paintMode: "Paint",
    paintWidth: "Width",

    // PlacedCell
    removeFromLayout: "Remove from layout",

    // ImageUploader
    dropOrClickToSelect: "Drop image or click to select",
    supportedFormats: "PNG, JPEG supported",

    // LayoutCanvas
    fillBackground: "Fill background",
    clickToAddToLayout: "Click labels on the left image to add",
    clickToAddVerticalGuide: "Click to add/remove vertical guide",
    clickToAddHorizontalGuide: "Click to add/remove horizontal guide",
    removeGuide: "Remove guide",
    customColor: "Custom color",
    clickToDelete: "Click to delete",
    clickToAddCell: "Click to add to layout",

    // Background presets
    white: "White",
    cream: "Cream",
    ivory: "Ivory",
    sepiaLight: "Sepia Light",
    sepia: "Sepia",
    sepiaDark: "Sepia Dark",
  },
  ja: {
    // Toolbar
    export: "エクスポート",

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
    clickToAddHorizontalLine: "クリックで横カット線を追加",
    clickToAddVerticalLine: "クリックで縦カット線を追加",

    // LineOverlay
    delete: "削除",

    // LayoutArea
    layout: "レイアウト",
    clear: "クリア",
    clearConfirm: "配置をすべてクリアしますか?",
    bgColor: "背景色",
    paintMode: "ペン",
    paintWidth: "太さ",

    // PlacedCell
    removeFromLayout: "レイアウトから削除",

    // ImageUploader
    dropOrClickToSelect: "画像をドロップ、またはクリックして選択",
    supportedFormats: "PNG, JPEG対応",

    // LayoutCanvas
    fillBackground: "背景を塗りつぶす",
    clickToAddToLayout: "左の画像上のラベルをクリックして追加",
    clickToAddVerticalGuide: "クリックで縦ガイド線を追加/削除",
    clickToAddHorizontalGuide: "クリックで横ガイド線を追加/削除",
    removeGuide: "ガイドを削除",
    customColor: "カスタム色",
    clickToDelete: "クリックで削除",
    clickToAddCell: "クリックでレイアウトに追加",

    // Background presets
    white: "白",
    cream: "クリーム",
    ivory: "アイボリー",
    sepiaLight: "セピア薄",
    sepia: "セピア",
    sepiaDark: "セピア濃",
  },
} as const;

export type Locale = keyof typeof messages;
type MessageKey = keyof (typeof messages)["en"];

const detectLocale = (): Locale => {
  const lang = navigator.language.slice(0, 2);
  return lang === "ja" ? "ja" : "en";
};

let currentLocale: Locale = detectLocale();
let listeners: Set<() => void> = new Set();

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
