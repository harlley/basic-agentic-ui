import { IconLoader2 } from "@tabler/icons-react";

type LoadingOverlayProps = {
  progress: number;
  currentFile?: string;
};

export function LoadingOverlay({ progress, currentFile }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-8">
        <IconLoader2 size={48} className="text-primary animate-spin" />

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Loading AI Model</h2>
          <p className="text-muted-foreground text-sm">
            Downloading and initializing the language model...
          </p>
        </div>

        <div className="w-full space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="truncate max-w-[200px]">
              {currentFile || "Initializing..."}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/60">
          This may take a moment on first load. The model will be cached for
          future visits.
        </p>
      </div>
    </div>
  );
}
