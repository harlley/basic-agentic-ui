export type ToolCall = {
  type: "function";
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
};

export type ChatMessage =
  | { role: "developer" | "user"; content: string }
  | { role: "assistant"; content?: string; tool_calls?: ToolCall[] }
  | { role: "tool"; content: Array<{ name: string; response: unknown }> };

export type FunctionCallResult = {
  functionName: string;
  args: Record<string, unknown>;
} | null;

export type UIMessage = {
  id: number;
  text: string;
  sender: "user" | "bot";
};
