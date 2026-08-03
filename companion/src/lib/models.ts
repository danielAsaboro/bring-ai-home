// These descriptors are frozen from @qvac/sdk@0.16.0's generated registry.
// That release's runtime exports the constants, but its NodeNext declaration
// re-export omits them. Explicit descriptors keep this course type-safe and
// make model provenance visible to learners.
export const COURSE_MODEL = {
  name: "LLAMA_3_2_1B_INST_Q4_0",
  src: "registry://hf/unsloth/Llama-3.2-1B-Instruct-GGUF/blob/b69aef112e9f895e6f98d7ae0949f72ff09aa401/Llama-3.2-1B-Instruct-Q4_0.gguf",
  registryPath:
    "unsloth/Llama-3.2-1B-Instruct-GGUF/blob/b69aef112e9f895e6f98d7ae0949f72ff09aa401/Llama-3.2-1B-Instruct-Q4_0.gguf",
  registrySource: "hf",
  modelId: "Llama-3.2-1B-Instruct-Q4_0.gguf",
  expectedSize: 773_025_824,
  sha256Checksum: "66bfbb2d48bdb77cd56bd03ef820deff3c4a74b1a09de3b917ae13e72c1a70c2",
  addon: "llm",
  engine: "llamacpp-completion",
  quantization: "q4_0",
  params: "1B",
} as const;

export type LocalModelVerification = {
  path: string;
  bytes: number;
  sha256?: string;
};

export const EMBEDDING_MODEL = {
  name: "EMBEDDINGGEMMA_300M_Q4_0",
  src: "registry://hf/unsloth/embeddinggemma-300m-GGUF/resolve/6661a6504c30d8304af13455cb4a5d4f5bc6011f/embeddinggemma-300m-Q4_0.gguf",
  registryPath:
    "unsloth/embeddinggemma-300m-GGUF/resolve/6661a6504c30d8304af13455cb4a5d4f5bc6011f/embeddinggemma-300m-Q4_0.gguf",
  registrySource: "hf",
  modelId: "embeddinggemma-300m-Q4_0.gguf",
  expectedSize: 277_852_192,
  sha256Checksum: "edc6015cb15694c27be7d1d33f1bc015db9a358ff51ed524628c027504907ba9",
  addon: "embeddings",
  engine: "llamacpp-embedding",
  quantization: "q4_0",
  params: "300M",
} as const;

export const SPEECH_MODEL = {
  name: "WHISPER_TINY_Q8_0",
  src: "registry://hf/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-tiny-q8_0.bin",
  registryPath: "ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-tiny-q8_0.bin",
  registrySource: "hf",
  modelId: "ggml-tiny-q8_0.bin",
  expectedSize: 43_537_433,
  sha256Checksum: "c2085835d3f50733e2ff6e4b41ae8a2b8d8110461e18821b09a15c40c42d1cca",
  addon: "whisper",
  engine: "whispercpp-transcription",
  quantization: "q8_0",
  params: "tiny",
} as const;
