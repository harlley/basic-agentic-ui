import { IconLoader2, IconSend } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { type Message, MessageBubble } from "./MessageBubble";

type ChatSidebarProps = {
  messages: readonly Message[];
  onSendMessage: (text: string) => Promise<void> | void;
  isLoading: boolean;
  disabled?: boolean;
  modelReady?: boolean;
  progress?: number;
  error?: string;
};

export function ChatSidebar({
  messages,
  onSendMessage,
  isLoading,
  disabled,
  modelReady = true,
  progress = 0,
  error,
}: ChatSidebarProps) {
  const [inputValue, setInputValue] = useState("");
  const isDisabled = isLoading || disabled || !!error;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isDisabled) return;
    onSendMessage(trimmed);
    setInputValue("");
  };

  return (
    <aside className="order-2 md:order-1 w-full md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-r border-border/50 bg-sidebar/50 backdrop-blur-md shrink-0 h-[45vh] md:h-full transition-all duration-300">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      <footer className="p-6 border-t border-border/30">
        <form onSubmit={handleSubmit}>
          <InputGroup className="bg-background/80 h-12 shadow-sm border-border/50 focus-within:ring-primary/20 transition-all">
            <InputGroupInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Write your message..."
              className="text-sm px-4"
              disabled={isDisabled}
            />
            <InputGroupButton
              type="submit"
              size="xs"
              variant="ghost"
              disabled={isDisabled}
              className="mr-1 h-9 w-9 rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <IconLoader2 size={18} className="animate-spin" />
              ) : (
                <IconSend size={18} />
              )}
            </InputGroupButton>
          </InputGroup>
        </form>
        {error ? (
          <p className="mt-2 text-xs text-red-500 text-center font-medium">
            {error}
          </p>
        ) : (
          <>
            {!modelReady && !isLoading && (
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Note: The first message will take longer as the model needs to
                be loaded.
              </p>
            )}
            {!modelReady && isLoading && (
              <div className="mt-2 w-full">
                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  Loading model... {Math.round(progress)}%
                </p>
              </div>
            )}
          </>
        )}
      </footer>
    </aside>
  );
}
