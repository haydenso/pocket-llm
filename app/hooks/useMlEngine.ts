'use client';

/**
 * Primary hook encapsulating ML engine lifecycle
 * Handles engine initialization, message streaming, and cache deletion
 */

import { useState, useRef, useCallback } from 'react';
import type { ModelKey, ModelStates, Message, EngineState } from '../../types/messages';
import { CreateMLCEngine, deleteModelAllInfoInCache } from '../../lib/mlc';
import type { MLCEngine } from '../../lib/mlc';
import { MODEL_CONFIGS } from '../../lib/models';
import { deleteMatchingDatabases } from '../../lib/indexeddb';
import { deleteMatchingCaches, unregisterAllServiceWorkers } from '../../lib/cacheHelpers';

const STREAM_UPDATE_INTERVAL = 100; // Update UI every 100ms during streaming

/**
 * Initialize engine state for a model
 */
function createInitialState(): EngineState {
  return {
    engine: null,
    messages: [],
    loading: false,
    progress: 0,
    tokensPerSec: 0,
    tokenCount: 0,
    status: 'Please download the model to begin.',
    error: undefined,
  };
}

/**
 * Hook for managing multiple ML engines
 */
export function useMlEngine() {
  // State for all models
  const [state, setState] = useState<ModelStates>({
    llama: createInitialState(),
    qwen: createInitialState(),
    smolm: createInitialState(),
    arcee: createInitialState(),
  });

  // Refs for streaming optimization
  const streamingBufferRef = useRef<Record<ModelKey, string>>({
    llama: '',
    qwen: '',
    smolm: '',
    arcee: '',
  });

  const streamingIntervalRef = useRef<Record<ModelKey, ReturnType<typeof setInterval> | null>>({
    llama: null,
    qwen: null,
    smolm: null,
    arcee: null,
  });

  /**
   * Initialize engine for a specific model
   */
  const initEngine = useCallback(async (modelKey: ModelKey) => {
    const modelConfig = MODEL_CONFIGS[modelKey];
    if (!modelConfig || !modelConfig.available) {
      console.error('Model not available:', modelKey);
      return;
    }

    setState((prev) => ({
      ...prev,
      [modelKey]: {
        ...prev[modelKey],
        loading: true,
        progress: 0,
        status: `Loading ${modelKey} model... This may take a minute on first run.`,
        error: undefined,
      },
    }));

    try {
      const engine = await CreateMLCEngine(modelConfig.name, {
        initProgressCallback: (progress) => {
          const percent = Math.round(progress.progress * 100);
          setState((prev) => ({
            ...prev,
            [modelKey]: {
              ...prev[modelKey],
              progress: percent,
              status: `Loading ${modelKey} model: ${percent}% - ${progress.text}. Don't worry if it's stuck.`,
            },
          }));
        },
      });

      setState((prev) => ({
        ...prev,
        [modelKey]: {
          ...prev[modelKey],
          engine,
          loading: false,
          status: `${modelKey} model loaded! Ready to chat.`,
          messages: [
            {
              role: 'system',
              content: `${modelKey} model loaded successfully! You can now start chatting.`,
            },
          ],
        },
      }));
    } catch (error: any) {
      console.error('Failed to initialize engine:', error);
      setState((prev) => ({
        ...prev,
        [modelKey]: {
          ...prev[modelKey],
          loading: false,
          status: 'Failed to load model. Check console for details.',
          error: error.message,
          messages: [
            {
              role: 'system',
              content: `Error: ${error.message}. Make sure WebGPU is supported in your browser.`,
            },
          ],
        },
      }));
    }
  }, []);

  /**
   * Send message and stream response
   * Uses batched updates to reduce renders during streaming
   */
  const sendMessage = useCallback(
    async (modelKey: ModelKey, text: string) => {
      const modelState = state[modelKey];
      if (!modelState.engine || !text.trim()) return;

      const userMessage: Message = { role: 'user', content: text };

      // Add user message to history
      setState((prev) => ({
        ...prev,
        [modelKey]: {
          ...prev[modelKey],
          messages: [...prev[modelKey].messages, userMessage],
          status: 'Generating response...',
        },
      }));

      const updatedMessages = [...modelState.messages, userMessage];

      try {
        const engine = modelState.engine as MLCEngine;
        const chunks = await engine.chat.completions.create({
          messages: updatedMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 512,
        });

        let fullResponse = '';
        let tokenCount = 0;
        const startTime = Date.now();
        streamingBufferRef.current[modelKey] = '';

        // Setup interval to batch UI updates
        if (streamingIntervalRef.current[modelKey]) {
          clearInterval(streamingIntervalRef.current[modelKey]!);
        }

        streamingIntervalRef.current[modelKey] = setInterval(() => {
          const buffer = streamingBufferRef.current[modelKey];
          if (buffer) {
            setState((prev) => {
              const messages = [...prev[modelKey].messages];
              const lastMsg = messages[messages.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.content = buffer;
              } else {
                messages.push({ role: 'assistant', content: buffer });
              }

              const elapsedSeconds = (Date.now() - startTime) / 1000;
              const tokensPerSec =
                elapsedSeconds > 0 ? (tokenCount / elapsedSeconds).toFixed(1) : '0';

              return {
                ...prev,
                [modelKey]: {
                  ...prev[modelKey],
                  messages,
                  tokensPerSec: parseFloat(tokensPerSec),
                  tokenCount,
                },
              };
            });
          }
        }, STREAM_UPDATE_INTERVAL);

        // Process stream
        for await (const chunk of chunks) {
          const delta = chunk.choices[0]?.delta.content || '';
          if (delta) {
            fullResponse += delta;
            tokenCount++;
            streamingBufferRef.current[modelKey] = fullResponse;
          }
        }

        // Final update
        if (streamingIntervalRef.current[modelKey]) {
          clearInterval(streamingIntervalRef.current[modelKey]!);
          streamingIntervalRef.current[modelKey] = null;
        }

        const totalElapsedSeconds = (Date.now() - startTime) / 1000;
        const finalTokensPerSec =
          totalElapsedSeconds > 0 ? (tokenCount / totalElapsedSeconds).toFixed(1) : '0';

        const assistantMessage: Message = { role: 'assistant', content: fullResponse };

        setState((prev) => ({
          ...prev,
          [modelKey]: {
            ...prev[modelKey],
            messages: [...updatedMessages, assistantMessage],
            tokensPerSec: parseFloat(finalTokensPerSec),
            tokenCount,
            status: `${modelKey} model loaded! Ready to chat.`,
          },
        }));

        streamingBufferRef.current[modelKey] = '';
      } catch (error: any) {
        // Clear interval on error
        if (streamingIntervalRef.current[modelKey]) {
          clearInterval(streamingIntervalRef.current[modelKey]!);
          streamingIntervalRef.current[modelKey] = null;
        }

        console.error('Error generating response:', error);
        const errorMessage: Message = {
          role: 'system',
          content: `Error: ${error.message}`,
        };

        setState((prev) => ({
          ...prev,
          [modelKey]: {
            ...prev[modelKey],
            messages: [...prev[modelKey].messages, errorMessage],
            status: 'Error occurred. Try again.',
            error: error.message,
          },
        }));

        streamingBufferRef.current[modelKey] = '';
      }
    },
    [state]
  );

  /**
   * Delete all model caches, IndexedDB databases, and service workers
   */
  const deleteAllCaches = useCallback(async (): Promise<void> => {
    try {
      // Delete model-specific caches using the library helper
      for (const modelKey of Object.keys(MODEL_CONFIGS)) {
        const config = MODEL_CONFIGS[modelKey as ModelKey];
        if (config.available && config.name) {
          try {
            await deleteModelAllInfoInCache(config.name);
            console.log('deleteModelAllInfoInCache succeeded for', config.name);
          } catch (err) {
            console.warn('deleteModelAllInfoInCache failed or not supported:', err);
          }
        }
      }

      // Clear IndexedDB databases matching model heuristics
      await deleteMatchingDatabases((name) => {
        const lowerName = name.toLowerCase();
        return (
          lowerName.includes('web-llm') ||
          lowerName.includes('mlc') ||
          lowerName.includes('tvmjs')
        );
      });

      // Clear Cache API entries
      await deleteMatchingCaches((name) => {
        const lowerName = name.toLowerCase();
        return (
          lowerName.includes('web-llm') ||
          lowerName.includes('transformers') ||
          lowerName.includes('tvmjs') ||
          lowerName.includes('mlc') ||
          lowerName.includes('tensor-cache')
        );
      });

      // Unregister service workers
      await unregisterAllServiceWorkers();

      // Reset all engine states
      setState({
        llama: {
          ...createInitialState(),
          messages: [
            {
              role: 'system',
              content:
                'Cache cleared successfully! Please refresh the page to download the model again.',
            },
          ],
        },
        qwen: {
          ...createInitialState(),
          messages: [
            {
              role: 'system',
              content:
                'Cache cleared successfully! Please refresh the page to download the model again.',
            },
          ],
        },
        smolm: {
          ...createInitialState(),
          messages: [
            {
              role: 'system',
              content:
                'Cache cleared successfully! Please refresh the page to download the model again.',
            },
          ],
        },
        arcee: createInitialState(),
      });
    } catch (error: any) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }, []);

  return {
    state,
    initEngine,
    sendMessage,
    deleteAllCaches,
  };
}
