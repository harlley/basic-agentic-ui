import { useState } from "react";
import { useFunctionCalling } from "@/hooks/useFunctionCalling";
import { useColorStore } from "@/store/useColorStore";
import { ChatSidebar } from "./ChatSidebar";
import { ColorControlForm } from "./ColorControlForm";
import { ColorVisualizer } from "./ColorVisualizer";
import type { Message } from "./MessageBubble";

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: "Hi! I can change the square color for you. Ask me to set a color or ask what color it currently is!",
    sender: "bot",
  },
];

export function AgenticInterface() {
  const { squareColor, setSquareColor } = useColorStore();
  const { processMessage, isProcessing, loadingStatus } = useFunctionCalling();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = { id: Date.now(), text, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    let botResponse: string;
    try {
      const result = await processMessage(text);

      if (result.functionCall?.functionName === "setSquareColor") {
        const color = result.functionCall.args.color as string | undefined;
        if (color) {
          setSquareColor(color);
          botResponse = `Done! I've changed the square color to ${color}.`;
        } else {
          botResponse =
            "I understood you want to change the color, but I couldn't determine which color. Please try again with a specific color.";
        }
      } else if (result.functionCall?.functionName === "getSquareColor") {
        botResponse = `The current color of the square is ${squareColor}.`;
      } else if (result.textResponse) {
        botResponse = result.textResponse;
      } else {
        botResponse =
          "Sorry, I had trouble understanding that. Could you please try again?";
      }
    } catch {
      botResponse =
        "Sorry, there was an error processing your request. Please try again.";
    }

    const botMessage: Message = {
      id: Date.now() + 1,
      text: botResponse,
      sender: "bot",
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      <ChatSidebar
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isProcessing || loadingStatus.isLoading}
        modelReady={loadingStatus.isModelReady}
        progress={loadingStatus.downloadProgress}
        error={loadingStatus.error}
      />

      <main className="order-1 md:order-2 flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden h-[55vh] md:h-full">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="flex flex-col items-center gap-6 z-10 w-full max-w-[320px] md:max-w-sm">
          <ColorVisualizer color={squareColor} />
          <ColorControlForm
            onColorChange={setSquareColor}
            disabled={!!loadingStatus.error}
          />
        </div>
      </main>
    </div>
  );
}
