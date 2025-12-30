import type { FunctionCallResult } from "@/types/chat";
import { toCamelCase } from "./utils";

/**
 * Parses FunctionGemma output format:
 * <start_function_call>call:func_name{param:<escape>value<escape>}<end_function_call>
 */
export function parseFunctionCall(output: string): FunctionCallResult {
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

/**
 * Cleans up model response by removing special tokens
 */
export function cleanupModelResponse(text: string): string {
  return (
    text
      .replace(/<start_function_call>[\s\S]*?<end_function_call>/g, "")
      .replace(/<start_function_response>[\s\S]*?<end_function_response>/g, "")
      .replace(/<end_of_turn>/g, "")
      .replace(/<start_of_turn>/g, "")
      .replace(/<\|im_end\|>/g, "")
      .replace(/<\|im_start\|>/g, "")
      .replace(/<\|endoftext\|>/g, "")
      .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, "")
      .replace(/^model\s*/i, "")
      .replace(/^assistant\s*/i, "")
      .trim() || "Done!"
  );
}
