import type { ToolDefinition } from "@/types/chat";

type GetSquareColorContext = {
  color: string;
};

export const getSquareColorTool: ToolDefinition = {
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
};

export function handleGetSquareColor(ctx: GetSquareColorContext) {
  return { color: ctx.color };
}
