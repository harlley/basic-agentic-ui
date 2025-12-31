import { create } from "zustand";
import type { ChatMessage, FunctionCallResult, UIMessage } from "@/types/chat";

const INITIAL_MESSAGE: UIMessage = {
  id: 1,
  text: "Hi! I can change the square color for you. Ask me to set a color or ask what color it currently is!",
  sender: "bot",
};

interface ChatState {
  messages: UIMessage[];
  addMessage: (message: UIMessage) => void;

  conversationMessages: ChatMessage[];
  lastFunctionCall: FunctionCallResult;
  setConversation: (
    messages: ChatMessage[],
    functionCall: FunctionCallResult,
  ) => void;
  clearConversation: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [INITIAL_MESSAGE],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  conversationMessages: [],
  lastFunctionCall: null,
  setConversation: (conversationMessages, lastFunctionCall) =>
    set({ conversationMessages, lastFunctionCall }),
  clearConversation: () =>
    set({ conversationMessages: [], lastFunctionCall: null }),
}));
