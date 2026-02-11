/**
 * Model configurations
 */

import type { ModelKey, ModelConfigs } from '../types/messages';

export const MODEL_CONFIGS: ModelConfigs = {
  llama: {
    name: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    displayName: 'Llama3.2',
    available: true,
  },
  qwen: {
    name: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    displayName: 'Qwen',
    available: true,
  },
  smolm: {
    name: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    displayName: 'SmolLM2',
    available: true,
  },
  arcee: {
    name: '',
    displayName: 'Arcee',
    available: false,
  },
};

export const AVAILABLE_MODELS: ModelKey[] = Object.entries(MODEL_CONFIGS)
  .filter(([_, config]) => config.available)
  .map(([key]) => key as ModelKey);

export const DEFAULT_MODEL: ModelKey = 'llama';
