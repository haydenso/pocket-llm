'use client';

/**
 * Cache controls component with theme selector
 * Manages download button, cache deletion, and theme switching
 */

import { useEffect, useState } from 'react';
import type { ModelKey } from '../../../types/messages';
import { MODEL_CONFIGS } from '../../../lib/models';

interface CacheControlsProps {
  selectedModel: ModelKey;
  isModelLoaded: boolean;
  onDownloadModel: () => void;
  onDeleteCache: () => Promise<void>;
  downloadDisabled: boolean;
}

type Theme = 'xp' | '7' | '98';

export function CacheControls({
  selectedModel,
  isModelLoaded,
  onDownloadModel,
  onDeleteCache,
  downloadDisabled,
}: CacheControlsProps) {
  const [theme, setTheme] = useState<Theme>('xp');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme) {
        setTheme(savedTheme);
        updateThemeStylesheet(savedTheme);
      }
    }
  }, []);

  const updateThemeStylesheet = (newTheme: Theme) => {
    const stylesheet = document.getElementById('theme-stylesheet') as HTMLLinkElement;
    if (stylesheet) {
      stylesheet.href = `https://unpkg.com/${newTheme}.css`;
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as Theme;
    setTheme(newTheme);
    updateThemeStylesheet(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleDeleteCache = async () => {
    if (
      confirm(
        'Are you sure you want to delete the model cache? This will require re-downloading the model.'
      )
    ) {
      setIsDeleting(true);
      try {
        await onDeleteCache();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const modelConfig = MODEL_CONFIGS[selectedModel];
  const showDownloadButton = modelConfig.available && !isModelLoaded;

  return (
    <div className="cache-controls">
      {showDownloadButton && (
        <button
          className="download-button"
          onClick={onDownloadModel}
          disabled={downloadDisabled}
        >
          Download Model
        </button>
      )}
      <button
        className="cache-button"
        onClick={handleDeleteCache}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete Model Cache'}
      </button>
      <select
        className="cache-button"
        value={theme}
        onChange={handleThemeChange}
        aria-label="Theme selector"
      >
        <option value="xp">XP.css</option>
        <option value="7">7.css</option>
        <option value="98">98.css</option>
      </select>
    </div>
  );
}
