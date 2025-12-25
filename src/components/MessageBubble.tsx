import { IconRobot, IconUser } from "@tabler/icons-react";

type MessageSender = "user" | "bot";

type Message = {
  id: number;
  text: string;
  sender: MessageSender;
};

type MessageBubbleProps = {
  message: Message;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`flex items-center gap-2 mb-1.5 px-1 ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-border/50 overflow-hidden">
          {isUser ? <IconUser size={12} /> : <IconRobot size={12} />}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40">
          {isUser ? "You" : "Assistant"}
        </span>
      </div>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/20"
            : "bg-muted/80 backdrop-blur-sm text-foreground rounded-tl-none border border-border/50"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

export type { Message, MessageSender };
