import { useSyncExternalStore } from "react";
import { getLocale, subscribeLocale, type Locale } from "../i18n";

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale);
}
