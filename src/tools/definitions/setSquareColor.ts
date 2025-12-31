import { useSquareStore } from "@/store/useSquareStore";
import type { ToolDefinition } from "@/types/chat";

export const setSquareColorTool: ToolDefinition = {
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
};

export function handleSetSquareColor(args: Record<string, unknown>) {
  const { color } = args;
  if (typeof color !== "string" || !color) return { error: "Invalid args" };
  useSquareStore.getState().setSquareColor(color);
  return { success: true, color };
}
