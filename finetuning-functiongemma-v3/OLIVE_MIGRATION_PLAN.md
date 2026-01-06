# Migration Plan: Olive + ONNX Runtime Web

## Overview

This plan outlines the migration from Transformers.js (full) to a hybrid approach using:
- **Olive** for fine-tuning and ONNX export (in Google Colab)
- **Transformers.js** for tokenization only
- **ONNX Runtime Web** for inference with WebGPU

This approach solves the fp16 quantization issues we encountered with fine-tuned Gemma models.

## Background

### Problem
Fine-tuned Gemma 3 models exported to ONNX with fp16/q4f16 produce garbage output (`<unused49>`, `<pad>` tokens) when using Transformers.js in the browser. Multiple conversion approaches failed:
- `build_gemma.py` (original)
- Manual fp32→fp16 conversion
- Docker Transformers.js conversion
- Google's official Colab notebooks

### Solution
Use Microsoft's hybrid architecture from [onnxruntime-inference-examples/js/chat](https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/chat):
- Tokenizer: `@huggingface/transformers` (AutoTokenizer)
- Inference: `onnxruntime-web` with WebGPU
- Model: Olive-exported ONNX with proper quantization

---

## Phase 1: Fine-tune with Olive (Google Colab)

### 1.1 Create Colab Notebook

Create `finetuning-functiongemma-v2/finetune_olive_v2.ipynb` with:

#### Setup Cell
```python
# Install dependencies (specific versions for compatibility)
!pip install torch==2.4.0 transformers==4.44.0 -q
!pip install olive-ai[gpu] -q
!pip install onnxruntime-genai-cuda -q
!pip install optimum peft bitsandbytes -q

# Verify GPU
!nvidia-smi
```

#### Training Data Cell
```python
import json

# Function calling training data
training_data = [
    {"prompt": "Change the square to red", "completion": "<function_call>set_square_color(color='red')</function_call>"},
    {"prompt": "Make it blue", "completion": "<function_call>set_square_color(color='blue')</function_call>"},
    {"prompt": "What color is the square?", "completion": "<function_call>get_square_color()</function_call>"},
    # ... more examples
]

with open("train_data.jsonl", "w") as f:
    for item in training_data:
        f.write(json.dumps(item) + "\n")
```

#### Fine-tune Cell
```bash
!olive finetune \
    --method qlora \
    --model_name_or_path google/gemma-3-270m-it \
    --data_name train_data.jsonl \
    --text_template "<start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n{completion}" \
    --per_device_train_batch_size 4 \
    --max_steps 100 \
    --logging_steps 10 \
    --output_path ./finetuned-model
```

### 1.2 Export to ONNX for Web

#### Export Cell
```bash
!olive auto-opt \
    --model_name_or_path ./finetuned-model \
    --output_path ./onnx-model \
    --device gpu \
    --provider cuda \
    --precision fp16 \
    --use_model_builder
```

#### Verify Output Structure
```python
import os
for root, dirs, files in os.walk("./onnx-model"):
    for f in files:
        path = os.path.join(root, f)
        size = os.path.getsize(path) / 1024 / 1024
        print(f"{path}: {size:.1f} MB")
```

### 1.3 Upload to Hugging Face

```python
from huggingface_hub import HfApi, login

login()

api = HfApi()
api.upload_folder(
    folder_path="./onnx-model",
    repo_id="harlley/functiongemma-square-color-olive",
    repo_type="model",
)
```

---

## Phase 2: Adapt Browser Application

### 2.1 Install Dependencies

Update `package.json`:
```json
{
  "dependencies": {
    "@huggingface/transformers": "^3.0.0",
    "onnxruntime-web": "^1.17.0"
  }
}
```

### 2.2 Create Model Cache Utility

Create `src/lib/load-model.ts` for caching ONNX models:

```typescript
const CACHE_NAME = 'onnx-models-v1';

export async function loadModel(
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE_NAME);

  // Check if already cached
  const cachedResponse = await cache.match(url);
  if (cachedResponse) {
    console.log('Loading model from cache:', url);
    return cachedResponse.arrayBuffer();
  }

  // Download with progress tracking
  console.log('Downloading model:', url);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch model: ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response reader');
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }

  // Combine chunks into single ArrayBuffer
  const buffer = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  // Store in cache for next time
  const responseToCache = new Response(buffer, {
    headers: { 'Content-Type': 'application/octet-stream' }
  });
  await cache.put(url, responseToCache);
  console.log('Model cached:', url);

  return buffer.buffer;
}

export async function clearModelCache(): Promise<void> {
  await caches.delete(CACHE_NAME);
}

export async function isModelCached(url: string): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(url);
  return response !== undefined;
}
```

### 2.3 Create LLM Class

Create `src/lib/llm.ts` based on Microsoft's example:

```typescript
import * as ort from 'onnxruntime-web';
import { loadModel } from './load-model';

export class LLM {
  private session: ort.InferenceSession | null = null;
  private kvCache: Map<string, ort.Tensor> = new Map();

  async load(modelUrl: string, onProgress?: (loaded: number, total: number) => void) {
    // Fetch model with caching
    const modelBuffer = await loadModel(modelUrl, onProgress);

    // Load model with WebGPU
    this.session = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['webgpu', 'wasm'],
      graphOptimizationLevel: 'all',
    });
  }

  async generate(inputIds: number[], maxTokens: number, callback: (tokens: number[]) => void) {
    // Token generation loop with KV cache management
    // See Microsoft's llm.js for reference
  }

  private initializeKvCache() {
    // Initialize empty KV cache tensors
  }

  private updateKvCache(outputs: ort.InferenceSession.OnnxValueMapType) {
    // Update KV cache with new values
  }
}
```

### 2.4 Create Hybrid Worker

Update `src/worker.ts`:

```typescript
import { AutoTokenizer } from '@huggingface/transformers';
import { LLM } from './lib/llm';
import * as Comlink from 'comlink';

const MODEL_URL = 'https://huggingface.co/harlley/functiongemma-square-color-olive/resolve/main/';

let tokenizer: any = null;
let llm: LLM | null = null;

const workerAPI = {
  async initModel(progressCallback: (p: any) => void) {
    // Load tokenizer from Transformers.js
    tokenizer = await AutoTokenizer.from_pretrained('harlley/functiongemma-square-color-olive');

    // Load model with ONNX Runtime Web
    llm = new LLM();
    await llm.load(MODEL_URL + 'model.onnx', (p) => progressCallback({ progress: p }));
  },

  async generate(messages: ChatMessage[], tools: ToolDefinition[]) {
    // Tokenize with Transformers.js
    const inputs = tokenizer.apply_chat_template(messages, { tools, tokenize: true });

    // Generate with ONNX Runtime Web
    const outputTokens: number[] = [];
    await llm.generate(inputs, 512, (tokens) => {
      outputTokens.push(...tokens);
    });

    // Decode with Transformers.js
    return tokenizer.decode(outputTokens, { skip_special_tokens: false });
  }
};

Comlink.expose(workerAPI);
```

### 2.5 Update Vite Config

Add ONNX Runtime Web WASM files to public:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['onnxruntime-web']
  },
  build: {
    commonjsOptions: {
      include: [/onnxruntime-web/]
    }
  }
});
```

---

## Phase 3: Testing & Validation

### 3.1 Local Testing

```bash
npm run dev
```

Test cases:
1. "Change the color to blue" → should call `set_square_color(color='blue')`
2. "What color is the square?" → should call `get_square_color()`
3. "Make it red" → should call `set_square_color(color='red')`

### 3.2 Performance Metrics

Measure:
- Model load time
- Time to first token
- Tokens per second
- Memory usage

### 3.3 Browser Compatibility

Test on:
- Chrome 121+ (WebGPU + fp16)
- Edge 122+ (WebGPU + fp16)
- Firefox (WASM fallback)
- Safari (WASM fallback)

---

## File Structure

```
basic-agentic-ui/
├── src/
│   ├── lib/
│   │   ├── load-model.ts       # NEW: Model loading with Cache API
│   │   └── llm.ts              # NEW: ONNX Runtime Web LLM class
│   ├── worker.ts               # MODIFIED: Hybrid approach
│   ├── hooks/
│   │   └── useFunctionCalling.ts
│   └── components/
│       └── AgenticInterface.tsx
├── finetuning-functiongemma-v2/
│   ├── finetune_olive_v2.ipynb # NEW: Olive fine-tuning notebook
│   └── ONNX_EXPORT_REPORT.md   # Updated with findings
└── OLIVE_MIGRATION_PLAN.md     # This file
```

---

## References

- [Microsoft ONNX Runtime Chat Example](https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/chat)
- [Live Demo](https://guschmue.github.io/ort-webgpu/chat/index.html)
- [Olive Documentation](https://microsoft.github.io/Olive/)
- [ONNX Runtime Web WebGPU](https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html)
- [ONNX Runtime GenAI Fine-tune Tutorial](https://onnxruntime.ai/docs/genai/tutorials/finetune.html)

---

## Task Checklist

### Phase 1: Colab Notebook
- [ ] Create `finetune_olive_v2.ipynb`
- [ ] Test fine-tuning with sample data
- [ ] Export to ONNX with fp16
- [ ] Verify model structure
- [ ] Upload to Hugging Face

### Phase 2: Browser Application
- [ ] Install `onnxruntime-web`
- [ ] Create `src/lib/load-model.ts`
- [ ] Create `src/lib/llm.ts`
- [ ] Update `src/worker.ts` for hybrid approach
- [ ] Update Vite config for WASM files
- [ ] Test WebGPU detection and fallback

### Phase 3: Validation
- [ ] Test function calling accuracy
- [ ] Measure performance metrics
- [ ] Test browser compatibility
- [ ] Document results

---

## Notes

- Olive requires NVIDIA GPU - use Google Colab (free T4)
- torch 2.5.0 has export bugs - use 2.4.0
- transformers >= 4.45.0 is incompatible - use 4.44.0
- WebGPU fp16 requires Chrome 121+ or Edge 122+
- Model is cached in browser using Cache API (works for any model size)
