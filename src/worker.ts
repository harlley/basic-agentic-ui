import {
  AutoModelForCausalLM,
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
} from "@huggingface/transformers";
import * as Comlink from "comlink";

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

const tools = [
  {
    type: "function",
    function: {
      name: "set_square_color",
      description: "Sets the color of the square displayed on the screen.",
      parameters: {
        type: "object",
        properties: {
          color: {
            type: "string",
            description: "The color to set, e.g. red, blue, green",
          },
        },
        required: ["color"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_square_color",
      description:
        "Returns the current color of the square. Use this when the user asks 'what color is the square' or 'tell me the color'.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// Exact prompt from functiongemma documentation
const developerPrompt =
  "You are a model that can do function calling with the following functions";

export type FunctionCallResult = {
  functionName: string;
  args: Record<string, unknown>;
} | null;

// Parses functiongemma output: <start_function_call>call:func_name{param:<escape>value<escape>}<end_function_call>
function parseFunctionCall(output: string): FunctionCallResult {
  const match = output.match(
    /<start_function_call>call:(\w+)\{([^}]*)\}<end_function_call>/,
  );

  if (!match) return null;

  const funcName = match[1];
  const argsStr = match[2];

  // Convert snake_case to camelCase for internal use
  const functionName =
    funcName === "set_square_color"
      ? "setSquareColor"
      : funcName === "get_square_color"
        ? "getSquareColor"
        : funcName;

  if (functionName === "getSquareColor") {
    return { functionName, args: {} };
  }

  // Parse: color:<escape>blue<escape>
  const colorMatch = argsStr.match(/color:<escape>([^<]+)<escape>/);
  if (colorMatch) {
    const color = colorMatch[1].trim().toLowerCase();
    return { functionName, args: { color } };
  }

  return null;
}

const workerAPI = {
  async initModel(progressCallback: ProgressCallback): Promise<void> {
    console.log("[Worker] initModel called");
    await getModel(progressCallback);
    console.log("[Worker] initModel completed");
  },

  async processMessage(text: string): Promise<{
    functionCall: FunctionCallResult;
    textResponse?: string;
  }> {
    console.log("[Worker] ========== NEW REQUEST ==========");
    console.log("[Worker] User input:", text);

    if (!text.trim()) return { functionCall: null };

    const { model, tokenizer } = await getModel();

    const messages = [
      { role: "developer", content: developerPrompt },
      { role: "user", content: text },
    ];

    console.log("[Worker] Messages:", JSON.stringify(messages, null, 2));

    const inputs = tokenizer.apply_chat_template(messages, {
      tools,
      tokenize: true,
      add_generation_prompt: true,
      return_dict: true,
    }) as { input_ids: { dims: number[]; data: unknown } };

    console.log("[Worker] Input token count:", inputs.input_ids.dims[1]);
    console.log("[Worker] Input structure:", Object.keys(inputs));
    console.log(
      "[Worker] input_ids type:",
      typeof inputs.input_ids,
      inputs.input_ids.constructor?.name,
    );

    try {
      const inputIds = Array.from(inputs.input_ids.data as Iterable<number>);
      const decodedInput = tokenizer.decode(inputIds, {
        skip_special_tokens: false,
      });
      console.log("[Worker] Decoded input (what model sees):", decodedInput);
    } catch (e) {
      console.log("[Worker] Could not decode input:", e);
    }

    // biome-ignore lint/complexity/noBannedTypes: model.generate type is not properly typed in transformers.js
    const output = await (model.generate as Function)({
      ...inputs,
      max_new_tokens: 512,
    });

    const inputLength = inputs.input_ids.dims[1];
    const outputLength = output.dims ? output.dims[1] : output.length;
    console.log("[Worker] Output token count:", outputLength);
    console.log("[Worker] New tokens generated:", outputLength - inputLength);

    const decoded = tokenizer.decode(output.slice(0, [inputLength, null]), {
      skip_special_tokens: false,
    });

    console.log("[Worker] Raw model output:", decoded);
    const functionCall = parseFunctionCall(decoded as string);
    console.log("[Worker] Parsed function call:", functionCall);

    // If function was called, don't return text response (it's usually garbage)
    if (functionCall) {
      console.log(
        "[Worker] ✅ Function call successful:",
        functionCall.functionName,
      );
      return { functionCall };
    }

    // If model generated an error format, return null to trigger fallback
    if ((decoded as string).includes("<start_function_call>error:")) {
      console.log(
        "[Worker] ⚠️ Model generated error format, triggering fallback",
      );
      return { functionCall: null };
    }

    console.log("[Worker] ❌ No function call detected, returning fallback");

    const textResponse = (decoded as string)
      .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "")
      .replace(/<\|im_end\|>/g, "")
      .replace(/<\|im_start\|>/g, "")
      .replace(/<\|endoftext\|>/g, "")
      .replace(/<start_function_call>[\s\S]*?<end_function_call>/g, "")
      .replace(/<start_function_response>/g, "")
      .trim();

    return { functionCall: null, textResponse: textResponse || undefined };
  },
};

export type WorkerAPI = typeof workerAPI;

Comlink.expose(workerAPI);
