import { cookies } from "next/headers";

import { DEFAULT_LANG, LANG_COOKIE, dict, type Lang, type TranslationKey } from "./i18n";

/** Server-side language resolution from the `sb_lang` cookie. */
export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  const value = jar.get(LANG_COOKIE)?.value;
  return value === "en" ? "en" : value === "ar" ? "ar" : DEFAULT_LANG;
}

export async function getT(): Promise<(key: TranslationKey) => string> {
  const lang = await getLang();
  return (key: TranslationKey) => dict[lang][key];
}

export function directionOf(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
