'use client';

/**
 * Main page component - composes all UI components and manages app state
 */

import { useState } from 'react';
import type { ModelKey } from '../types/messages';
import { DEFAULT_MODEL, MODEL_CONFIGS } from '../lib/models';
import { useMlEngine } from './hooks/useMlEngine';
import { ModelTabs } from './components/ModelTabs/ModelTabs';
import { ChatWindow } from './components/ChatWindow/ChatWindow';
import { ProgressBar } from './components/ProgressBar/ProgressBar';
import { StatsBar } from './components/StatsBar/StatsBar';
import { InputBar } from './components/InputBar/InputBar';
import { CacheControls } from './components/CacheControls/CacheControls';

export default function HomePage() {
  const [selectedModel, setSelectedModel] = useState<ModelKey>(DEFAULT_MODEL);
  const [inputValue, setInputValue] = useState('');

  const { state, initEngine, sendMessage, deleteAllCaches } = useMlEngine();

  const currentState = state[selectedModel];
  const modelConfig = MODEL_CONFIGS[selectedModel];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    await sendMessage(selectedModel, inputValue);
    setInputValue('');
  };

  const handleDownloadModel = () => {
    initEngine(selectedModel);
  };

  const handleSelectModel = (model: ModelKey) => {
    setSelectedModel(model);
    setInputValue('');
  };

  // For arcee placeholder
  const isPlaceholder = !modelConfig.available;
  const showStats = currentState.tokensPerSec > 0 || currentState.tokenCount > 0;

  return (
    <div className="app-container">
      <div className="window">
        <div className="title-bar">
          <div className="title-bar-text">pocket llm - WebGPU</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>

        <div className="window-body">
          <p className="subtitle">
            all powered in the browser, no apis. making webgpu llms go brrr. built
            by&nbsp;
            <a href="https://haydenso.com">hayden so</a>
          </p>

          <section className="tabs">
            <ModelTabs
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
            />

            {isPlaceholder ? (
              <article role="tabpanel" id={`${selectedModel}-tab`}>
                <div className="placeholder-content">
                  <div className="message system">
                    {modelConfig.displayName} model - To be added
                  </div>
                  <p style={{ textAlign: 'center', color: '#808080' }}>
                    This model will be available soon. Stay tuned!
                  </p>
                </div>
              </article>
            ) : (
              <article role="tabpanel" id={`${selectedModel}-tab`}>
                <ChatWindow
                  messages={
                    currentState.messages.length > 0
                      ? currentState.messages
                      : [
                          {
                            role: 'system',
                            content: 'Please download the model to begin chatting.',
                          },
                        ]
                  }
                />

                <ProgressBar
                  progress={currentState.progress}
                  visible={currentState.loading}
                />

                <StatsBar
                  tokensPerSec={currentState.tokensPerSec}
                  tokenCount={currentState.tokenCount}
                  visible={showStats}
                />

                <InputBar
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSendMessage}
                  disabled={!currentState.engine || currentState.loading}
                />
              </article>
            )}
          </section>

          <div className="status-bar">
            <p className="status-bar-field">
              <span className="status-indicator"></span>
              <span>{currentState.status}</span>
            </p>
          </div>

          <CacheControls
            selectedModel={selectedModel}
            isModelLoaded={!!currentState.engine}
            onDownloadModel={handleDownloadModel}
            onDeleteCache={deleteAllCaches}
            downloadDisabled={currentState.loading}
          />
        </div>
      </div>
    </div>
  );
}
