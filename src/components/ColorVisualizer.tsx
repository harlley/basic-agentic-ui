type ColorVisualizerProps = {
  color: string
}

export function ColorVisualizer({ color }: ColorVisualizerProps) {
  return (
    <div className="relative group w-full">
      <div
        className="absolute inset-0 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50"
        style={{ backgroundColor: color }}
      />
      <div
        className="relative w-full aspect-square rounded-[2.5rem] shadow-2xl transition-all duration-1000 flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: color,
          boxShadow: `0 20px 50px -12px ${color}`,
        }}
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl animate-pulse" />
      </div>
    </div>
  )
}

