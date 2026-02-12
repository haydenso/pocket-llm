/**
 * Model configurations
 */

import type { ModelKey, ModelConfigs } from '../types/messages';

export const MODEL_CONFIGS: ModelConfigs = {
  llama: {
    name: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    displayName: 'Llama3.2-1B',
    available: true,
  },
  qwen: {
    name: 'Qwen3-0.6B-q4f16_1-MLC',
    displayName: 'Qwen3-0.6B',
    available: true,
  },
  smolm: {
    name: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    displayName: 'SmolLM2-1.7B',
    available: true,
  },
  arcee: {
    name: 'Felladrin/mlc-q4f16_1-arcee-lite',
    displayName: 'Arcee',
    available: false,
  },
  deepseek: {
    name: 'DeepSeek-R1-Distill-Qwen-1.5B-q0f16-MLC',
    displayName: 'DeepSeek-R1-1.5B',
    available: true,
  },
};


export const AVAILABLE_MODELS: ModelKey[] = Object.entries(MODEL_CONFIGS)
  .filter(([_, config]) => config.available)
  .map(([key]) => key as ModelKey);

export const DEFAULT_MODEL: ModelKey = 'llama';
