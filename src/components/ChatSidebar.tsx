import { IconSend } from "@tabler/icons-react";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { type Message, MessageBubble } from "./MessageBubble";
import { SidebarHeader } from "./SidebarHeader";

type ChatSidebarProps = {
  messages: readonly Message[];
};

export function ChatSidebar({ messages }: ChatSidebarProps) {
  return (
    <aside className="order-2 md:order-1 w-full md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-r border-border/50 bg-sidebar/50 backdrop-blur-md shrink-0 h-[45vh] md:h-full transition-all duration-300">
      <SidebarHeader />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      <footer className="p-6 border-t border-border/30">
        <InputGroup className="bg-background/80 h-12 shadow-sm border-border/50 focus-within:ring-primary/20 transition-all">
          <InputGroupInput
            placeholder="Write your message..."
            className="text-sm px-4"
          />
          <InputGroupButton
            size="xs"
            variant="ghost"
            className="mr-1 h-9 w-9 rounded-full hover:bg-primary hover:text-white transition-colors"
          >
            <IconSend size={18} />
          </InputGroupButton>
        </InputGroup>
      </footer>
    </aside>
  );
}
