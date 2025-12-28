# Fine-tuning FunctionGemma for Square Color Control

This directory contains everything needed to fine-tune FunctionGemma to recognize square color control commands.

## 📋 Overview

FunctionGemma is a base model that requires fine-tuning to work well with custom functions. This project demonstrates:

1. **Dataset creation** for function calling
2. **Fine-tuning with LoRA** using HuggingFace TRL
3. **Export to ONNX** for browser use
4. **Deploy to Hugging Face Hub**

## 🚀 Quick Start

### Option 1: Google Colab (Recommended)
1. Upload the entire `finetuning-functiongemma/` folder to [Google Colab](https://colab.research.google.com)
2. Open the notebook `finetune_functiongemma.ipynb`
3. Select GPU runtime (T4 is sufficient)
4. Run all cells

> **Note:** The notebook loads the dataset from `dataset/square_color_dataset.json`, so make sure to keep the folder structure intact.

### Option 2: Hugging Face Spaces
1. Create a new Space with the Gradio template
2. Configure a GPU Space (if needed)
3. Use the notebook inside the Space

## 📁 Structure

```
finetuning-functiongemma/
├── README.md                     # This file
├── finetune_functiongemma.ipynb  # Main notebook
├── dataset/
│   └── square_color_dataset.json # Training dataset
└── export_to_onnx.py             # Script to convert to ONNX
```

## 🎯 Target Functions

The model will be trained to recognize two functions:

### `set_square_color`
Changes the square color to a new color.

**Example inputs:**
- "Change the color to blue"
- "Make it red"
- "Set the square to green"

### `get_square_color`
Returns the current color of the square.

**Example inputs:**
- "What color is the square?"
- "Tell me the current color"
- "Which color is it?"

## 📊 Dataset

The dataset contains varied examples in English, including:
- Direct commands ("set to red")
- Indirect commands ("I want it blue")
- Questions ("what color?")
- Natural language variations

## 🔧 Requirements

```bash
pip install torch transformers datasets trl accelerate
pip install optimum[onnxruntime]  # For ONNX export
```

## 📝 Important Notes

1. **GPU Required**: Fine-tuning requires GPU (minimum T4)
2. **Time**: ~10-15 minutes with 60 examples and 8 epochs
3. **Format**: The model uses special `<escape>` tokens for strings

## 🔗 Useful Links

- [FunctionGemma Docs](https://ai.google.dev/gemma/docs/functiongemma)
- [Official Fine-tuning Tutorial](https://ai.google.dev/gemma/docs/functiongemma/finetuning-with-functiongemma)
- [HuggingFace TRL](https://huggingface.co/docs/trl)

## Author

Created as an AI Engineering portfolio project.
