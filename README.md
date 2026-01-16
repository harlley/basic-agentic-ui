---
title: Basic Agentic UI
emoji: 🤖
colorFrom: blue
colorTo: purple
pinned: true
---

# Basic Agentic UI

A demonstration application that runs an ML model for function calling directly in the browser. The model interprets natural language commands and controls the color of a visual square in the interface.

**[Live Demo](https://huggingface.co/spaces/harlley/basic-agentic-ui)**

## Features

- Natural language processing in the browser via WebGPU
- Function calling to control UI elements
- FunctionGemma-270M model running locally
- Interactive chat interface
- Real-time color visualizer

## Architecture

### Overview

```
+---------------------------------------------------------------------+
|                           Browser                                   |
|  +----------------------+     +----------------------------------+  |
|  |      Main Thread      |     |          Web Worker              |  |
|  |  +----------------+   |     |  +----------------------------+  |  |
|  |  | AgenticInterface|   |     |  |   Transformers.js          |  |  |
|  |  |                 |   |     |  |  +----------------------+  |  |  |
|  |  |  +-----------+  |   |     |  |  |  FunctionGemma-270M  |  |  |  |
|  |  |  |ChatSidebar|  |<--+-----+--+  |      (WebGPU)        |  |  |  |
|  |  |  +-----------+  | Comlink |  |  +----------------------+  |  |  |
|  |  |  +-----------+  |   |     |  +----------------------------+  |  |
|  |  |  |ColorVis.  |  |   |     +----------------------------------+  |
|  |  |  +-----------+  |   |                                          |
|  |  +----------------+   |                                          |
|  |          |            |                                          |
|  |  +-------v--------+   |                                          |
|  |  |  Zustand Store  |   |                                          |
|  |  |  (squareColor)  |   |                                          |
|  |  +----------------+   |                                          |
|  +----------------------+                                           |
+---------------------------------------------------------------------+
```

### Main Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **AgenticInterface** | `src/components/AgenticInterface.tsx` | Main orchestrator that manages layout and coordinates chat + visualizer |
| **ChatSidebar** | `src/components/ChatSidebar.tsx` | Chat interface with input and message history |
| **ColorVisualizer** | `src/components/ColorVisualizer.tsx` | Visual square that reflects the current color state |
| **useChat** | `src/hooks/useChat.ts` | Hook that manages Web Worker communication and message processing |
| **Worker** | `src/worker.ts` | Web Worker that runs the FunctionGemma model via Transformers.js |
| **Zustand Store** | `src/store/useSquareStore.ts` | Global state for the square color |

### Data Flow

```
1. User sends message
        |
        v
2. useChat hook receives the message
        |
        v
3. Message sent to Web Worker via Comlink
        |
        v
4. Worker processes with FunctionGemma-270M (WebGPU)
        |
        v
5. Model returns output with function call
   <start_function_call>call:set_square_color{color:<escape>blue<escape>}<end_function_call>
        |
        v
6. parseFunctionCall() extracts function name and arguments
        |
        v
7. Function handler is executed (e.g., setSquareColor)
        |
        v
8. Zustand store updates the state
        |
        v
9. ColorVisualizer re-renders with the new color
```

### Function Calling System

The model uses a specific format for function calls:

```
<start_function_call>call:function_name{param:<escape>value<escape>}<end_function_call>
```

**Available functions:**

| Function | Description | Parameters |
|----------|-------------|------------|
| `set_square_color` | Sets the color of the square | `color: string` |
| `get_square_color` | Returns the current color | - |

### Project Structure

```
src/
├── components/
│   ├── AgenticInterface.tsx    # Main orchestrator component
│   ├── ChatSidebar.tsx         # Sidebar with chat
│   ├── MessageBubble.tsx       # Individual message component
│   ├── ColorVisualizer.tsx     # Color visualizer
│   ├── ColorControlForm.tsx    # Manual control form
│   └── ui/                     # shadcn components
├── hooks/
│   └── useChat.ts              # Chat and function calling hook
├── store/
│   ├── useSquareStore.ts       # Square color store
│   └── useChatStore.ts         # Messages store
├── tools/
│   └── definitions/            # Available function definitions
│       ├── getSquareColor.ts
│       └── setSquareColor.ts
├── lib/
│   ├── functionCalling.ts      # Function call parser
│   └── utils.ts                # Utilities
├── types/
│   └── chat.ts                 # TypeScript types
├── worker.ts                   # Web Worker for inference
├── App.tsx
└── main.tsx
```

## Technologies

| Category | Technology |
|----------|------------|
| Frontend | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| State | Zustand |
| ML Runtime | Hugging Face Transformers.js |
| Model | FunctionGemma-270M (WebGPU, 4-bit quantization) |
| Worker Communication | Comlink |

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format
```

## Requirements

- Browser with WebGPU support (Chrome 113+, Edge 113+)
- ~270MB download for the model on first run
