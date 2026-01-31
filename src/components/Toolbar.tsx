import { Scissors } from "lucide-react";

export function Toolbar() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
      <div className="flex items-center gap-2">
        <Scissors size={24} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-800">ScoreCutter</h1>
      </div>
    </header>
  );
}
