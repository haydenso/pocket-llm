/**
 * Type definitions for application state and messages
 */

export type ModelKey = 'llama' | 'qwen' | 'smolm' | 'arcee';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EngineState {
  engine: any | null;
  messages: Message[];
  loading: boolean;
  progress: number;
  tokensPerSec: number;
  tokenCount: number;
  status: string;
  error?: string;
}

export type ModelStates = Record<ModelKey, EngineState>;

export interface ModelConfig {
  name: string;
  displayName: string;
  available: boolean;
}

export type ModelConfigs = Record<ModelKey, ModelConfig>;
