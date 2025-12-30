import {
  AutoModelForCausalLM,
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
} from "@huggingface/transformers";
import * as Comlink from "comlink";
import type { ChatMessage, ToolDefinition } from "./types/chat";

const MODEL_ID = "onnx-community/functiongemma-270m-it-ONNX";

let modelPromise: Promise<{
  model: PreTrainedModel;
  tokenizer: PreTrainedTokenizer;
}> | null = null;

export type LoadingProgress = {
  status: "initiate" | "download" | "progress" | "done" | "ready";
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

type ProgressCallback = (progress: LoadingProgress) => void;

function getModel(onProgress?: ProgressCallback) {
  modelPromise ??= (async () => {
    console.log("[Worker] Loading model...");
    const [tokenizer, model] = await Promise.all([
      AutoTokenizer.from_pretrained(MODEL_ID, {
        progress_callback: onProgress,
      }),
      AutoModelForCausalLM.from_pretrained(MODEL_ID, {
        dtype: "fp16",
        device: "webgpu",
        progress_callback: onProgress,
      }),
    ]);
    console.log("[Worker] Model loaded!");
    return { model, tokenizer };
  })();
  return modelPromise;
}

const workerAPI = {
  async initModel(progressCallback: ProgressCallback): Promise<void> {
    console.log("[Worker] initModel called");
    await getModel(progressCallback);
    console.log("[Worker] initModel completed");
  },

  async generate(
    messages: ChatMessage[],
    tools: ToolDefinition[],
  ): Promise<string> {
    console.log("[Worker] ========== GENERATE ==========");
    console.log("[Worker] Messages:", JSON.stringify(messages, null, 2));

    const { model, tokenizer } = await getModel();

    // biome-ignore lint/suspicious/noExplicitAny: tokenizer accepts flexible message format
    const inputs = tokenizer.apply_chat_template(messages as any, {
      tools,
      tokenize: true,
      add_generation_prompt: true,
      return_dict: true,
    }) as { input_ids: { dims: number[]; data: unknown } };

    console.log("[Worker] Input token count:", inputs.input_ids.dims[1]);

    // biome-ignore lint/complexity/noBannedTypes: model.generate type is not properly typed in transformers.js
    const output = await (model.generate as Function)({
      ...inputs,
      max_new_tokens: 512,
    });

    const inputLength = inputs.input_ids.dims[1];
    const decoded = tokenizer.decode(output.slice(0, [inputLength, null]), {
      skip_special_tokens: false,
    });

    console.log("[Worker] Raw output:", decoded);

    return decoded as string;
  },
};

export type WorkerAPI = typeof workerAPI;

Comlink.expose(workerAPI);
