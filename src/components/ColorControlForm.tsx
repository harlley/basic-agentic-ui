import { IconArrowRight, IconLoader2 } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_SOURCE_LANG,
  isSourceLanguage,
  SOURCE_LANGUAGES,
  type SourceLanguage,
  sourceLanguageLabel,
} from "@/lib/translationLanguages";

type ColorControlFormProps = {
  onColorChange: (color: string) => void;
  translate: (text: string, srcLang: string) => Promise<string>;
  isLoading: boolean;
};

export function ColorControlForm({
  onColorChange,
  translate,
  isLoading,
}: ColorControlFormProps) {
  const [inputValue, setInputValue] = useState("");
  const [sourceLang, setSourceLang] =
    useState<SourceLanguage>(DEFAULT_SOURCE_LANG);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    const translated = await translate(trimmedInput, sourceLang);
    onColorChange(translated.trim().toLowerCase());
    setInputValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <p className="text-[10px] text-center font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">
        Manual Override
      </p>
      <div className="flex items-center justify-center">
        <Select
          value={sourceLang}
          onValueChange={(value) => {
            if (isSourceLanguage(value)) setSourceLang(value);
          }}
        >
          <SelectTrigger className="w-full justify-between">
            <SelectValue>{(value) => sourceLanguageLabel(value)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SOURCE_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <InputGroup className="bg-card/40 backdrop-blur-xl border-border/50 h-14 rounded-2xl shadow-xl shadow-black/5 ring-offset-background focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <InputGroupInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="write color to update"
          className="text-center text-lg font-medium placeholder:font-normal placeholder:opacity-50"
        />
        <InputGroupButton
          type="submit"
          variant="ghost"
          disabled={isLoading}
          className="mr-1 h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <IconLoader2 size={22} className="text-primary animate-spin" />
          ) : (
            <IconArrowRight
              size={22}
              className="text-primary group-hover/btn:text-white transition-colors"
            />
          )}
        </InputGroupButton>
      </InputGroup>
    </form>
  );
}
