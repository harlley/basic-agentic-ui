import { useCallback } from "react";
import { colorTools } from "@/config/tools";
import { useChat } from "@/hooks/useChat";
import { useChatStore } from "@/store/useChatStore";
import type { FunctionCallResult } from "@/types/chat";
import { ChatSidebar } from "./ChatSidebar";
import { ColorControlForm } from "./ColorControlForm";
import { ColorVisualizer } from "./ColorVisualizer";

export function AgenticInterface() {
  const { squareColor, setSquareColor } = useChatStore();

  const handleFunctionCall = useCallback(
    async (fc: FunctionCallResult) => {
      if (fc?.functionName === "setSquareColor") {
        const color = fc.args.color as string;
        setSquareColor(color);
        return { success: true, color };
      }
      if (fc?.functionName === "getSquareColor") {
        return { color: squareColor };
      }
      return { error: "Unknown function" };
    },
    [squareColor, setSquareColor],
  );

  const { messages, sendMessage, isProcessing, loadingStatus } = useChat({
    tools: colorTools,
    onFunctionCall: handleFunctionCall,
  });

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      <ChatSidebar
        messages={messages}
        onSendMessage={sendMessage}
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
