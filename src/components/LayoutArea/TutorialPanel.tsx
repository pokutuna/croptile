import { Check, Trash2 } from "lucide-react";
import { t } from "../../i18n";
import { useLocale } from "../../hooks/useLocale";

interface TutorialPanelProps {
  hasImages: boolean;
  hasCells: boolean;
  hasCompletedTutorial: boolean;
  hasCleared: boolean;
}

export function TutorialPanel({
  hasImages,
  hasCells,
  hasCompletedTutorial,
  hasCleared,
}: TutorialPanelProps) {
  useLocale();

  const step1Done = hasCompletedTutorial || hasImages;
  const step2Done = hasCompletedTutorial || hasCells;
  const step3Done = hasCompletedTutorial || hasCleared;
  const step4Done = hasCompletedTutorial || hasCleared;
  const step5Done = hasCompletedTutorial;
  const step6Done = hasCompletedTutorial || hasCleared;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-gray-600 text-sm space-y-3 bg-white/95 rounded-lg p-5 shadow-md pointer-events-auto whitespace-nowrap">
        <TutorialStep done={step1Done} step={1}>
          {t("tutorialStep1")}
        </TutorialStep>
        <TutorialStep done={step2Done} step={2}>
          {t("tutorialStep2")}
        </TutorialStep>
        <TutorialStep done={step3Done} step={3}>
          {t("tutorialStep3Pre")}{" "}
          <span className="inline-block px-1.5 py-0.5 bg-green-500 text-white text-xs font-bold rounded">
            {t("addCell")}
          </span>{" "}
          {t("tutorialStep3Post")}
        </TutorialStep>
        <TutorialStep done={step4Done} step={4}>
          <div>
            <div>{t("tutorialStep4")}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {t("tutorialStep4Sub")}
            </div>
          </div>
        </TutorialStep>
        <TutorialStep done={step5Done} step={5}>
          {t("tutorialStep5")}
        </TutorialStep>
        <TutorialStep done={step6Done} step={6}>
          {t("tutorialStep6Pre")}
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded mx-1">
            <Trash2 size={10} />
            {t("clear")}
          </span>
          {t("tutorialStep6Post")}
        </TutorialStep>
      </div>
    </div>
  );
}

function TutorialStep({
  done,
  step,
  children,
}: {
  done: boolean;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      {done ? (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
          <Check size={12} />
        </span>
      ) : (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center font-medium">
          {step}
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}
