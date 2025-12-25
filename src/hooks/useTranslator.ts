import * as Comlink from "comlink";
import { useEffect, useRef, useState } from "react";
import { ENGLISH_LANG } from "@/lib/translationLanguages";
import type { TranslatorAPI } from "@/worker";

export function useTranslator() {
  const apiRef = useRef<Comlink.Remote<TranslatorAPI> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module",
    });

    apiRef.current = Comlink.wrap<TranslatorAPI>(worker);

    return () => {
      worker.terminate();
      apiRef.current = null;
    };
  }, []);

  const translate = async (text: string, srcLang: string): Promise<string> => {
    if (srcLang === ENGLISH_LANG) return text;

    const api = apiRef.current;
    if (!api) return text;

    setIsLoading(true);
    try {
      return await api.translate(text, srcLang);
    } finally {
      setIsLoading(false);
    }
  };

  return { translate, isLoading };
}
