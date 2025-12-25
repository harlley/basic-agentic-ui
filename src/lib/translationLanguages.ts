export const ENGLISH_LANG = "eng_Latn" as const;

export const DEFAULT_SOURCE_LANG = ENGLISH_LANG;

export const SOURCE_LANGUAGES = [
  { value: "eng_Latn", label: "English" },
  { value: "por_Latn", label: "Português" },
  { value: "spa_Latn", label: "Español" },
  { value: "ita_Latn", label: "Italiano" },
  { value: "deu_Latn", label: "Deutsch" },
  { value: "fra_Latn", label: "Français" },
] as const;

export type SourceLanguage = (typeof SOURCE_LANGUAGES)[number]["value"];

export function isSourceLanguage(value: unknown): value is SourceLanguage {
  return SOURCE_LANGUAGES.some((lang) => lang.value === value);
}

export function sourceLanguageLabel(value: unknown): string {
  return (
    SOURCE_LANGUAGES.find((lang) => lang.value === value)?.label ??
    String(value ?? "")
  );
}
