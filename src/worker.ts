import { pipeline, TextStreamer } from '@huggingface/transformers';

class TranslationPipeline {
    static task = 'translation';
    static model = 'Xenova/nllb-200-distilled-600M';
    static instance: any = null;

    static async getInstance(progress_callback: any = null) {
        this.instance ??= pipeline(this.task, this.model, { progress_callback });
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const translator = await TranslationPipeline.getInstance((x: any) => {
        self.postMessage(x);
    });

    const output = await translator(event.data.text, {
        tgt_lang: 'eng_Latn',
        src_lang: 'por_Latn',
    });

    self.postMessage({
        status: 'complete',
        output: output[0].translation_text,
    });
});
