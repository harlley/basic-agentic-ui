import {
  AutoModelForCausalLM,
  AutoTokenizer,
  type PreTrainedModel,
  type PreTrainedTokenizer,
} from "@huggingface/transformers";
import * as Comlink from "comlink";
import { createStore } from "zustand/vanilla";
import { toCamelCase, toSnakeCase } from "./lib/utils";

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

// Types for FunctionGemma multi-turn conversation
type ToolCall = {
  type: "function";
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
};

type ChatMessage =
  | { role: "developer" | "user"; content: string }
  | { role: "assistant"; content?: string; tool_calls?: ToolCall[] }
  | { role: "tool"; content: Array<{ name: string; response: unknown }> };

export type FunctionCallResult = {
  functionName: string;
  args: Record<string, unknown>;
} | null;

type ConversationState = {
  messages: ChatMessage[];
  lastFunctionCall: FunctionCallResult;
  setMessages: (messages: ChatMessage[]) => void;
  setLastFunctionCall: (fc: FunctionCallResult) => void;
  clear: () => void;
};

// Store to maintain conversation state between processMessage and continueWithToolResult
const conversationStore = createStore<ConversationState>((set) => ({
  messages: [],
  lastFunctionCall: null,
  setMessages: (messages) => set({ messages }),
  setLastFunctionCall: (fc) => set({ lastFunctionCall: fc }),
  clear: () => set({ messages: [], lastFunctionCall: null }),
}));

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

// Parses functiongemma output: <start_function_call>call:func_name{param:<escape>value<escape>}<end_function_call>
function parseFunctionCall(output: string): FunctionCallResult {
  const match = output.match(
    /<start_function_call>call:(\w+)\{([^}]*)\}<end_function_call>/,
  );

  if (!match) return null;

  const funcName = match[1];
  const argsStr = match[2];

  // Convert function name from snake_case to camelCase
  const functionName = toCamelCase(funcName);

  // Parse all arguments generically
  // Format: key:<escape>value<escape>
  const args: Record<string, unknown> = {};
  const argRegex = /(\w+):<escape>([^<]*)<escape>/g;

  for (const argMatch of argsStr.matchAll(argRegex)) {
    const key = toCamelCase(argMatch[1]);
    const value = argMatch[2].trim();
    args[key] = value;
  }

  return { functionName, args };
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

    // If function was called, save conversation state for continueWithToolResult
    if (functionCall) {
      console.log(
        "[Worker] ✅ Function call successful:",
        functionCall.functionName,
      );

      // Save conversation state for the next turn
      const { setMessages, setLastFunctionCall } = conversationStore.getState();
      setMessages([
        { role: "developer", content: developerPrompt },
        { role: "user", content: text },
      ]);
      setLastFunctionCall(functionCall);

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

  async continueWithToolResult(
    functionName: string,
    functionResult: unknown,
  ): Promise<string> {
    console.log("[Worker] ========== CONTINUE WITH TOOL RESULT ==========");
    console.log("[Worker] Function:", functionName);
    console.log("[Worker] Result:", functionResult);

    const { messages, lastFunctionCall, clear } = conversationStore.getState();

    if (messages.length === 0 || !lastFunctionCall) {
      console.log("[Worker] ⚠️ No conversation state found");
      return "I apologize, but I lost track of our conversation. Could you please try again?";
    }

    const { model, tokenizer } = await getModel();

    // Build the full conversation with tool result
    // Convert camelCase back to snake_case for the model
    const snakeCaseName = toSnakeCase(lastFunctionCall.functionName);

    // Build messages in the format expected by the tokenizer
    // Note: Using 'as unknown' to bypass strict typing since the tokenizer
    // accepts a more flexible format than what TypeScript infers
    const fullMessages = [
      ...messages,
      // Assistant turn with tool_calls
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
      // Tool response
      {
        role: "tool",
        content: [{ name: snakeCaseName, response: functionResult }],
      },
    ] as unknown[];

    console.log(
      "[Worker] Full messages for final response:",
      JSON.stringify(fullMessages, null, 2),
    );

    // biome-ignore lint/suspicious/noExplicitAny: tokenizer accepts flexible message format
    const inputs = tokenizer.apply_chat_template(fullMessages as any, {
      tools,
      tokenize: true,
      add_generation_prompt: true,
      return_dict: true,
    }) as { input_ids: { dims: number[]; data: unknown } };

    console.log("[Worker] Input token count:", inputs.input_ids.dims[1]);

    try {
      const inputIds = Array.from(inputs.input_ids.data as Iterable<number>);
      const decodedInput = tokenizer.decode(inputIds, {
        skip_special_tokens: false,
      });
      console.log(
        "[Worker] Decoded input for final response:",
        decodedInput,
      );
    } catch (e) {
      console.log("[Worker] Could not decode input:", e);
    }

    // biome-ignore lint/complexity/noBannedTypes: model.generate type is not properly typed in transformers.js
    const output = await (model.generate as Function)({
      ...inputs,
      max_new_tokens: 256,
    });

    const inputLength = inputs.input_ids.dims[1];
    const decoded = tokenizer.decode(output.slice(0, [inputLength, null]), {
      skip_special_tokens: false,
    });

    console.log("[Worker] Raw final response:", decoded);

    // Clear conversation state
    clear();

    // Clean up the response
    const cleanResponse = (decoded as string)
      .replace(/<start_function_call>[\s\S]*?<end_function_call>/g, "")
      .replace(/<start_function_response>[\s\S]*?<end_function_response>/g, "")
      .replace(/<\|im_end\|>/g, "")
      .replace(/<\|im_start\|>/g, "")
      .replace(/<\|endoftext\|>/g, "")
      .replace(/<end_of_turn>/g, "")
      .replace(/<start_of_turn>/g, "")
      .replace(/^model\s*/i, "")
      .replace(/^assistant\s*/i, "")
      .trim();

    console.log("[Worker] ✅ Final response:", cleanResponse);

    return cleanResponse || "Done!";
  },
};

export type WorkerAPI = typeof workerAPI;

Comlink.expose(workerAPI);
