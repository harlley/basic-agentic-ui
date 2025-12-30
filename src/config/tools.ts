import type { ToolDefinition } from "@/types/chat";

export const colorTools: ToolDefinition[] = [
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
