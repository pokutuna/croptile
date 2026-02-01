/**
 * HEX色コードから明るさを計算し、コントラストの良い色を返す
 */
export function getContrastColor(hexColor: string): string {
  // #RRGGBB から RGB を抽出
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 相対輝度を計算 (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // 明るい色には黒、暗い色には白
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
