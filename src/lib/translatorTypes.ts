import type { SOURCE_LANGUAGES } from "@/lib/translationLanguages";

export type TranslationResult = { translation_text: string };

export type Translator = (
  text: string,
  options: { src_lang: string; tgt_lang: string }
) => Promise<TranslationResult[]>;

export type SourceLanguage = (typeof SOURCE_LANGUAGES)[number]["value"];
