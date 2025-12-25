import { IconVolume } from "@tabler/icons-react";

export function SidebarHeader() {
  return (
    <header className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-transparent">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <IconVolume size={18} />
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight">ElevenLabs Agent</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Online
          </p>
        </div>
      </div>
    </header>
  );
}
