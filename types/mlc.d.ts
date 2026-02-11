/**
 * Type definitions for @mlc-ai/web-llm
 * Minimal safe types for the MLC engine
 */

declare module '@mlc-ai/web-llm' {
  export interface InitProgressReport {
    progress: number;
    text: string;
    timeElapsed: number;
  }

  export interface MLCEngineConfig {
    initProgressCallback?: (report: InitProgressReport) => void;
  }

  export interface ChatCompletionChunk {
    choices: Array<{
      delta: {
        content?: string;
        role?: string;
      };
      finish_reason?: string | null;
      index: number;
    }>;
  }

  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  export interface ChatCompletionRequest {
    messages: ChatMessage[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  }

  export interface MLCEngine {
    chat: {
      completions: {
        create: (request: ChatCompletionRequest) => Promise<AsyncIterable<ChatCompletionChunk>>;
      };
    };
  }

  export function CreateMLCEngine(
    modelId: string,
    config?: MLCEngineConfig
  ): Promise<MLCEngine>;

  export function deleteModelAllInfoInCache(modelId: string): Promise<void>;
}
