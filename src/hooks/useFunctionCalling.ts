import * as Comlink from "comlink";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FunctionCallResult, LoadingProgress, WorkerAPI } from "@/worker";

export type LoadingStatus = {
  isLoading: boolean;
  isModelReady: boolean;
  downloadProgress: number;
  currentFile?: string;
  error?: string;
};

export function useFunctionCalling() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<WorkerAPI> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    isLoading: true,
    isModelReady: false,
    downloadProgress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    const api = Comlink.wrap<WorkerAPI>(worker);
    apiRef.current = api;

    const initModel = async () => {
      console.log("[useFunctionCalling] Starting model initialization...");
      let lastUpdate = 0;
      try {
        await api.initModel(
          Comlink.proxy((progress: LoadingProgress) => {
            // Throttle updates to avoid "Maximum update depth exceeded"
            const now = Date.now();
            if (now - lastUpdate < 100) return;
            lastUpdate = now;

            console.log("[useFunctionCalling] Progress:", progress);
            setLoadingStatus((prev) => ({
              ...prev,
              currentFile: progress.file ?? prev.currentFile,
              downloadProgress: progress.progress ?? prev.downloadProgress,
            }));
          })
        );
        console.log("[useFunctionCalling] Model loaded successfully!");
        setLoadingStatus({
          isLoading: false,
          isModelReady: true,
          downloadProgress: 100,
        });
      } catch (error) {
        console.error("[useFunctionCalling] Failed to load model:", error);
        setLoadingStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load model",
        }));
      }
    };

    initModel();

    return () => {
      worker.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  const processMessage = useCallback(
    async (
      text: string
    ): Promise<{ functionCall: FunctionCallResult; textResponse?: string }> => {
      const api = apiRef.current;
      if (!api) return { functionCall: null };

      setIsProcessing(true);
      try {
        return await api.processMessage(text);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return { processMessage, isProcessing, loadingStatus };
}
