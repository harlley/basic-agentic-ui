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
