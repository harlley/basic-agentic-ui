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
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    isLoading: false,
    isModelReady: false,
    downloadProgress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!("gpu" in navigator)) {
      setLoadingStatus((prev) => ({
        ...prev,
        error: "WebGPU is not available in your browser.",
      }));
      return;
    }

    const worker = new Worker(new URL("../worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    const api = Comlink.wrap<WorkerAPI>(worker);
    apiRef.current = api;

    return () => {
      worker.terminate();
      workerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  const initModel = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;

    setLoadingStatus((prev) => ({ ...prev, isLoading: true }));
    console.log("[useFunctionCalling] Starting model initialization...");

    const fileProgress = new Map<string, { loaded: number; total: number }>();
    let lastUpdate = 0;

    try {
      await api.initModel(
        Comlink.proxy((progress: LoadingProgress) => {
          if (progress.file) {
            fileProgress.set(progress.file, {
              loaded: progress.loaded ?? 0,
              total: progress.total ?? 0,
            });
          }

          // Throttle updates to avoid "Maximum update depth exceeded"
          const now = Date.now();
          if (now - lastUpdate < 100) return;
          lastUpdate = now;

          let totalLoaded = 0;
          let grandTotal = 0;
          for (const val of fileProgress.values()) {
            totalLoaded += val.loaded;
            grandTotal += val.total;
          }

          const currentProgress =
            grandTotal > 0 ? (totalLoaded / grandTotal) * 100 : 0;

          console.log("[useFunctionCalling] Progress:", progress);
          setLoadingStatus((prev) => ({
            ...prev,
            currentFile: progress.file ?? prev.currentFile,
            downloadProgress: currentProgress,
          }));
        }),
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
      throw error;
    }
  }, []);

  const processMessage = useCallback(
    async (
      text: string,
    ): Promise<{ functionCall: FunctionCallResult; textResponse?: string }> => {
      const api = apiRef.current;
      if (!api) return { functionCall: null };

      if (!initializationPromiseRef.current) {
        initializationPromiseRef.current = initModel().catch((err) => {
          initializationPromiseRef.current = null;
          throw err;
        });
      }

      try {
        await initializationPromiseRef.current;
      } catch {
        return {
          functionCall: null,
          textResponse: "Failed to initialize model. Please try again.",
        };
      }

      setIsProcessing(true);
      try {
        return await api.processMessage(text);
      } finally {
        setIsProcessing(false);
      }
    },
    [initModel],
  );

  const continueWithToolResult = useCallback(
    async (functionName: string, functionResult: unknown): Promise<string> => {
      const api = apiRef.current;
      if (!api) return "Error: Worker not available";

      setIsProcessing(true);
      try {
        return await api.continueWithToolResult(functionName, functionResult);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { processMessage, continueWithToolResult, isProcessing, loadingStatus };
}
