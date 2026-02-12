'use client';

/**
 * Model tabs component with keyboard navigation support
 * Renders accessible tab buttons and manages tab selection
 */

import type { ModelKey } from '../../../types/messages';
import { MODEL_CONFIGS } from '../../../lib/models';

interface ModelTabsProps {
  selectedModel: ModelKey;
  onSelectModel: (model: ModelKey) => void;
}

const TAB_ORDER: ModelKey[] = ['llama', 'qwen', 'deepseek', 'smolm', 'arcee'];

export function ModelTabs({ selectedModel, onSelectModel }: ModelTabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        newIndex = index > 0 ? index - 1 : TAB_ORDER.length - 1;
        break;
      case 'ArrowRight':
        newIndex = index < TAB_ORDER.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = TAB_ORDER.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    onSelectModel(TAB_ORDER[newIndex]);
  };

  return (
    <menu role="tablist" aria-label="Model Tabs">
      {TAB_ORDER.map((modelKey, index) => {
        const config = MODEL_CONFIGS[modelKey];
        const isSelected = selectedModel === modelKey;
        const tabPanelId = `${modelKey}-tab`;

        return (
          <button
            key={modelKey}
            role="tab"
            aria-selected={isSelected}
            aria-controls={tabPanelId}
            onClick={() => onSelectModel(modelKey)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={isSelected ? 0 : -1}
          >
            {config.displayName}
          </button>
        );
      })}
    </menu>
  );
}
