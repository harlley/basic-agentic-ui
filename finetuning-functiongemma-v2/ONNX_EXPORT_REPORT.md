# ONNX Export Issue Report: FunctionGemma Fine-tuned Model

## Summary

After fine-tuning `google/functiongemma-270m-it` with QLoRA and exporting to ONNX using Xenova's `build_gemma.py` script, the model works correctly with `fp32` precision but fails with `fp16` and `q4f16` quantizations when running in the browser with Transformers.js and WebGPU.

## Environment

- **Base Model:** `google/functiongemma-270m-it`
- **Fine-tuning Method:** QLoRA with `modules_to_save=["lm_head", "embed_tokens"]`
- **ONNX Export Script:** [build_gemma.py by Xenova](https://gist.github.com/xenova/a219dbf3c7da7edd5dbb05f92410d7bd)
- **Package Versions:**
  - transformers: 4.56.1
  - onnx: 1.19.0
  - onnxruntime: 1.22.1
  - numpy: 2.3.2

## Test Results

| dtype | device | Python ONNX Runtime | Browser (Transformers.js) |
|-------|--------|---------------------|---------------------------|
| fp32 | webgpu | ✅ Works | ✅ Works |
| fp16 | webgpu | Not tested | ❌ Outputs `<unused49>` garbage |
| q4 | wasm | Not tested | ✅ Works (slower) |
| q4f16 | webgpu | Not tested | ❌ Outputs `<unused49>` garbage |

## Symptoms

When using `fp16` or `q4f16` with WebGPU in the browser, the model outputs repeated `<unused49>` tokens instead of valid function calls:

```
[Worker] Raw output: <unused49><unused49><unused49><unused49>...
```

The same model with `fp32` correctly outputs:
```
[Worker] Raw output: <start_function_call>call:set_square_color{color:<escape>blue<escape>}<end_function_call>
```

## Root Cause Analysis

### ONNX File Size Discrepancy

Comparing the `.onnx` graph files (not the `_data` weight files) between the fine-tuned model and the working community model:

| File | Fine-tuned Model | onnx-community Model |
|------|------------------|----------------------|
| model.onnx | 193 KB | 503 KB |
| model_fp16.onnx | 258 KB | 619 KB |
| model_q4.onnx | 239 KB | 430 KB |
| model_q4f16.onnx | 304 KB | 519 KB |

The fine-tuned model's `.onnx` graph files are approximately **half the size** of the community model's, suggesting the ONNX graph structure is different or incomplete.

Note: The `_data` files (containing actual weights) are identical in size between both models, indicating the weights themselves are present.

### Hypothesis

The `build_gemma.py` script may not be correctly handling the fp16/q4f16 quantization for models that were fine-tuned with modified `lm_head` and `embed_tokens` layers. The fp32 export works because it preserves the full precision graph, while the quantized versions may be missing or corrupting certain operations.

## Working Configuration

For immediate use, the following configuration works:

```typescript
// src/worker.ts
AutoModelForCausalLM.from_pretrained(MODEL_ID, {
  dtype: "fp32",
  device: "webgpu",
})
```

**Trade-off:** The fp32 model is larger (~1.1 GB) but provides correct output with GPU acceleration.

## Investigation Paths

### 1. Debug build_gemma.py Quantization

- Compare the ONNX graphs between fp32 (working) and fp16 (broken) exports
- Use `onnx.load()` and inspect the graph nodes
- Check if certain operations are missing or have incorrect types in fp16

```python
import onnx

model_fp32 = onnx.load("model.onnx")
model_fp16 = onnx.load("model_fp16.onnx")

# Compare node counts
print(f"fp32 nodes: {len(model_fp32.graph.node)}")
print(f"fp16 nodes: {len(model_fp16.graph.node)}")

# List operations
fp32_ops = set(n.op_type for n in model_fp32.graph.node)
fp16_ops = set(n.op_type for n in model_fp16.graph.node)
print(f"Missing in fp16: {fp32_ops - fp16_ops}")
```

### 2. Use Alternative Quantization Tools

Try quantizing the fp32 ONNX model separately using:

- **onnxruntime quantization:**
  ```python
  from onnxruntime.quantization import quantize_dynamic, QuantType

  quantize_dynamic(
      "model.onnx",
      "model_fp16_manual.onnx",
      weight_type=QuantType.QUInt8
  )
  ```

- **Optimum ONNX export:** If/when Gemma3 support is added
  ```bash
  optimum-cli export onnx --model harlley/functiongemma-square-color --task text-generation-with-past
  ```

### 3. Compare with Community Model Export Process

The `onnx-community/functiongemma-270m-it-ONNX` model works correctly. Investigate:

- What exact script/process was used to export it?
- Are there differences in the transformers or onnx versions used?
- Was the community model exported from the base model (not fine-tuned)?

### 4. Test Fine-tuning Without embed_tokens Modification

The fine-tuning used `modules_to_save=["lm_head", "embed_tokens"]`. Try:

- Fine-tuning without `embed_tokens` in `modules_to_save`
- Only using LoRA adapters without full layer modifications
- Check if the embedding layer modification causes the quantization issue

### 5. Report Issue to Xenova/Transformers.js

File an issue with:
- Reproduction steps
- ONNX graph comparison
- Environment details

Relevant repositories:
- https://github.com/xenova/transformers.js
- https://gist.github.com/xenova/a219dbf3c7da7edd5dbb05f92410d7bd

## Files Reference

- **Fine-tuning notebook:** `finetuning-functiongemma-v2/finetune_functiongemma.ipynb`
- **ONNX export notebook:** `finetuning-functiongemma-v2/export_to_onnx_official.ipynb`
- **Worker configuration:** `src/worker.ts`
- **Working model (community):** `onnx-community/functiongemma-270m-it-ONNX`
- **Fine-tuned model (fp16 broken):** `harlley/functiongemma-square-color-ONNX`

## Conclusion

The fine-tuned FunctionGemma model successfully exports to ONNX and runs correctly with `fp32` precision. The `fp16` and `q4f16` quantizations produce corrupted outputs in the browser, likely due to an issue in the `build_gemma.py` quantization process when handling fine-tuned models with modified embedding layers.

**Recommended immediate action:** Use `fp32` + `webgpu` for production.

**Future optimization:** Investigate the quantization issue using the paths outlined above to enable smaller model sizes with fp16/q4f16.
