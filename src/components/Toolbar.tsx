import { Scissors, Languages } from "lucide-react";
import { setLocale } from "../i18n";
import { useLocale } from "../hooks/useLocale";

export function Toolbar() {
  const locale = useLocale();

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as "en" | "ja");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Scissors size={24} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-800">CropTile</h1>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Languages size={16} />
        <span>Language:</span>
        <select
          value={locale}
          onChange={handleLocaleChange}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors cursor-pointer"
        >
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
    </header>
  );
}
