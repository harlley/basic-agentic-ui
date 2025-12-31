import * as Comlink from "comlink";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cleanupModelResponse, parseFunctionCall } from "@/lib/functionCalling";
import { toCamelCase, toSnakeCase } from "@/lib/utils";
import { useChatStore } from "@/store/useChatStore";
import type { ChatMessage, ClientFunction } from "@/types/chat";
import type { LoadingProgress, WorkerAPI } from "@/worker";

const DEVELOPER_PROMPT =
  "You are a model that can do function calling with the following functions";

export type LoadingStatus = {
  isLoading: boolean;
  isModelReady: boolean;
  downloadProgress: number;
  currentFile?: string;
  error?: string;
};

export function useChat(functions: ClientFunction[]) {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<WorkerAPI> | null>(null);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
    isLoading: false,
    isModelReady: false,
    downloadProgress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const { messages, addMessage, setConversation } = useChatStore();

  const tools = useMemo(() => functions.map((fn) => fn.tool), [functions]);

  const functionsByName = useMemo(() => {
    const map = new Map<string, ClientFunction>();
    for (const fn of functions) {
      map.set(toCamelCase(fn.tool.function.name), fn);
    }
    return map;
  }, [functions]);

  // Initialize worker
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

  // Initialize model
  const initModel = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;

    setLoadingStatus((prev) => ({ ...prev, isLoading: true }));

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

          setLoadingStatus((prev) => ({
            ...prev,
            currentFile: progress.file ?? prev.currentFile,
            downloadProgress: currentProgress,
          }));
        }),
      );

      setLoadingStatus({
        isLoading: false,
        isModelReady: true,
        downloadProgress: 100,
      });
    } catch (error) {
      setLoadingStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load model",
      }));
      throw error;
    }
  }, []);

  // Continue conversation with tool result
  const continueWithResult = useCallback(
    async (result: unknown): Promise<string> => {
      const api = apiRef.current;

      // Get fresh state directly from store to avoid stale closure
      const { conversationMessages, lastFunctionCall, clearConversation } =
        useChatStore.getState();

      if (!api || !lastFunctionCall || conversationMessages.length === 0) {
        return "Error: no conversation to continue";
      }

      const snakeCaseName = toSnakeCase(lastFunctionCall.functionName);

      const fullMessages: ChatMessage[] = [
        ...conversationMessages,
        {
          role: "assistant",
          tool_calls: [
            {
              type: "function",
              function: {
                name: snakeCaseName,
                arguments: lastFunctionCall.args,
              },
            },
          ],
        },
        {
          role: "tool",
          content: [{ name: snakeCaseName, response: result }],
        },
      ];

      const rawOutput = await api.generate(fullMessages, tools);
      clearConversation();

      return cleanupModelResponse(rawOutput || "");
    },
    [tools],
  );

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      const api = apiRef.current;
      if (!api) return;

      // Ensure model is initialized
      if (!initializationPromiseRef.current) {
        initializationPromiseRef.current = initModel().catch((err) => {
          initializationPromiseRef.current = null;
          throw err;
        });
      }

      try {
        await initializationPromiseRef.current;
      } catch {
        addMessage({
          id: Date.now(),
          text: "Failed to initialize model. Please try again.",
          sender: "bot",
        });
        return;
      }

      // Add user message to UI
      addMessage({ id: Date.now(), text, sender: "user" });

      setIsProcessing(true);

      try {
        const mlMessages: ChatMessage[] = [
          { role: "developer", content: DEVELOPER_PROMPT },
          { role: "user", content: text },
        ];

        const rawOutput = await api.generate(mlMessages, tools);
        const functionCall = parseFunctionCall(rawOutput || "");

        if (functionCall) {
          const fn = functionsByName.get(functionCall.functionName);
          if (!fn) {
            addMessage({
              id: Date.now(),
              text: `Unknown function: ${functionCall.functionName}`,
              sender: "bot",
            });
            return;
          }
          // Save conversation state for continuation
          setConversation(mlMessages, functionCall);

          // Execute function and get result
          const result = await fn.handler(functionCall.args);

          // Continue conversation with result
          const response = await continueWithResult(result);
          addMessage({ id: Date.now(), text: response, sender: "bot" });
        } else {
          // No function call, just text response
          const response = cleanupModelResponse(rawOutput || "");
          addMessage({ id: Date.now(), text: response, sender: "bot" });
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [
      tools,
      functionsByName,
      addMessage,
      setConversation,
      continueWithResult,
      initModel,
    ],
  );

  return {
    messages,
    sendMessage,
    isProcessing,
    loadingStatus,
  };
}
