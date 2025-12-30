import { IconArrowRight } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type ColorControlFormProps = {
  onColorChange: (color: string) => void;
  disabled?: boolean;
};

export function ColorControlForm({
  onColorChange,
  disabled,
}: ColorControlFormProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || disabled) return;

    onColorChange(trimmedInput.toLowerCase());
    setInputValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <p className="text-[10px] text-center font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">
        Manual Override
      </p>
      <InputGroup className="bg-card/40 backdrop-blur-xl border-border/50 h-14 rounded-2xl shadow-xl shadow-black/5 ring-offset-background focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <InputGroupInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="write a color. Eg. red, blue, green, etc."
          className="text-center text-lg font-medium placeholder:font-normal placeholder:opacity-50"
          disabled={disabled}
        />
        <InputGroupButton
          type="submit"
          variant="ghost"
          disabled={disabled}
          className="mr-1 h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconArrowRight
            size={22}
            className="text-primary group-hover/btn:text-white transition-colors"
          />
        </InputGroupButton>
      </InputGroup>
    </form>
  );
}
