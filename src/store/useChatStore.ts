import { create } from "zustand";
import type {
  ChatMessage,
  FunctionCallResult,
  UIMessage,
} from "@/types/chat";

const INITIAL_MESSAGE: UIMessage = {
  id: 1,
  text: "Hi! I can change the square color for you. Ask me to set a color or ask what color it currently is!",
  sender: "bot",
};

interface ChatState {
  // UI Messages (displayed in chat)
  messages: UIMessage[];
  addMessage: (message: UIMessage) => void;

  // ML Conversation (for multi-turn function calling)
  conversationMessages: ChatMessage[];
  lastFunctionCall: FunctionCallResult;
  setConversation: (
    messages: ChatMessage[],
    functionCall: FunctionCallResult,
  ) => void;
  clearConversation: () => void;

  // App State
  squareColor: string;
  setSquareColor: (color: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // UI Messages
  messages: [INITIAL_MESSAGE],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  // ML Conversation
  conversationMessages: [],
  lastFunctionCall: null,
  setConversation: (conversationMessages, lastFunctionCall) =>
    set({ conversationMessages, lastFunctionCall }),
  clearConversation: () =>
    set({ conversationMessages: [], lastFunctionCall: null }),

  // App State
  squareColor: "rebeccapurple",
  setSquareColor: (squareColor) => set({ squareColor }),
}));
