import { pipeline } from "@huggingface/transformers";
import * as Comlink from "comlink";
import type { Translator } from "@/lib/translatorTypes";

const MODEL_ID = "Xenova/nllb-200-distilled-600M";
const DEFAULT_TGT_LANG = "eng_Latn";

let translatorPromise: Promise<Translator> | null = null;

function getTranslator(): Promise<Translator> {
  translatorPromise ??= pipeline(
    "translation",
    MODEL_ID
  ) as unknown as Promise<Translator>;
  return translatorPromise;
}

const translatorAPI = {
  async translate(text: string, srcLang: string): Promise<string> {
    if (!text.trim() || srcLang === DEFAULT_TGT_LANG) return text;

    const translator = await getTranslator();

    const output = await translator(text, {
      src_lang: srcLang,
      tgt_lang: DEFAULT_TGT_LANG,
    });

    return output[0]?.translation_text ?? "";
  },
};

export type TranslatorAPI = typeof translatorAPI;

Comlink.expose(translatorAPI);
