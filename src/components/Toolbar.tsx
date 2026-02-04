import { Scissors, Languages, Github } from "lucide-react";
import { setLocale, t } from "../i18n";
import { useLocale } from "../hooks/useLocale";

const GITHUB_URL = "https://github.com/pokutuna/croptile";

export function Toolbar() {
  const locale = useLocale();

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as "en" | "ja");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Scissors size={28} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-800">CropTile</h1>
        <span className="text-sm text-gray-500">{t("tagline")}</span>
      </div>
      <div className="flex items-center gap-4">
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
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-800 transition-colors"
          title="GitHub"
        >
          <Github size={20} />
        </a>
      </div>
    </header>
  );
}
