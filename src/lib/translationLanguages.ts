import type { SourceLanguage } from "@/lib/translatorTypes";

export const ENGLISH_LANG = "eng_Latn" as const;

export const DEFAULT_SOURCE_LANG = ENGLISH_LANG;

export const SOURCE_LANGUAGES = [
  { value: "eng_Latn", label: "English" },
  { value: "por_Latn", label: "Portuguese" },
  { value: "spa_Latn", label: "Spanish" },
  { value: "ita_Latn", label: "Italian" },
  { value: "deu_Latn", label: "German" },
  { value: "fra_Latn", label: "French" },
] as const;

export function isSourceLanguage(value: unknown): value is SourceLanguage {
  return SOURCE_LANGUAGES.some((lang) => lang.value === value);
}

export function sourceLanguageLabel(value: unknown): string {
  return (
    SOURCE_LANGUAGES.find((lang) => lang.value === value)?.label ??
    String(value ?? "")
  );
}
