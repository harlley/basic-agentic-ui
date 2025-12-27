# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # TypeScript build + Vite production build
npm run typecheck  # TypeScript type checking only
npm run lint       # Biome linting for src/
npm run format     # Biome formatting for src/
npm run check      # Biome check with auto-fix for src/
```

## Architecture

This is a React + TypeScript agentic UI demo that uses Hugging Face Transformers.js to run a function-calling ML model in the browser via Web Workers.

### Key Components

- **AgenticInterface** (`src/components/AgenticInterface.tsx`): Main orchestrator component that manages chat messages and coordinates the color-changing functionality
- **Worker** (`src/worker.ts`): Web Worker that runs functiongemma-270m model via @huggingface/transformers for function calling
- **useFunctionCalling** (`src/hooks/useFunctionCalling.ts`): Hook that manages communication with the Web Worker via Comlink
- **LoadingOverlay** (`src/components/LoadingOverlay.tsx`): Full-screen loading overlay shown during model download
- **Zustand Store** (`src/store/useColorStore.ts`): Global state for the square color

### Model

- **Model**: `onnx-community/functiongemma-270m-it-ONNX` (~270MB)
- **Runtime**: WebGPU with 4-bit quantization (`dtype: "q4"`)
- **Functions**: `set_square_color` and `get_square_color`

### Data Flow

1. User sends message via ChatSidebar
2. AgenticInterface passes message to useFunctionCalling hook
3. Hook communicates with Web Worker via Comlink
4. Worker uses functiongemma model to parse intent and extract function calls
5. If `set_square_color` function detected, color updates via Zustand store
6. If `get_square_color` function detected, returns current color
7. ColorVisualizer reflects the current color

### Function Calling Format

The model uses a specific format for function calls:
```
<start_function_call>call:function_name{param:<escape>value<escape>}<end_function_call>
```

### Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)

### Linting Notes

- Biome is configured to skip linting in `src/components/ui/**` (shadcn components)
- Uses 2-space indentation
