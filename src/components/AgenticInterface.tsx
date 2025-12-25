import { useColorStore } from "@/store/useColorStore"
import { useTranslator } from "@/hooks/useTranslator"
import { ChatSidebar } from "./ChatSidebar"
import { ColorVisualizer } from "./ColorVisualizer"
import { ColorControlForm } from "./ColorControlForm"
import type { Message } from "./MessageBubble"

const MESSAGES: readonly Message[] = [
  { id: 1, text: "Hi, how can I help you?", sender: "bot" },
  { id: 2, text: "Change the square color to green", sender: "user" },
]

export function AgenticInterface() {
  const { squareColor, setSquareColor } = useColorStore()
  const { translate, isLoading } = useTranslator()

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
      <ChatSidebar messages={MESSAGES} />

      <main className="order-1 md:order-2 flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden h-[55vh] md:h-full">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="flex flex-col items-center gap-12 z-10 w-full max-w-[320px] md:max-w-sm">
          <ColorVisualizer color={squareColor} />
          <ColorControlForm
            onColorChange={setSquareColor}
            translate={translate}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  )
}
