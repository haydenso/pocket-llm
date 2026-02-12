'use client';

interface StatsBarProps {
  tokensPerSec: number;
  tokenCount: number;
  visible: boolean;
}

export function StatsBar({ tokensPerSec, tokenCount, visible }: StatsBarProps) {
  return (
    <div className={`stats-bar ${visible ? 'visible' : ''}`}>
      <div className="stat-item">
        <span className="stat-label">Speed:</span>
        <span className="stat-value">{tokensPerSec.toFixed(1)} tok/s</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Tokens:</span>
        <span className="stat-value">{tokenCount}</span>
      </div>
    </div>
  );
}
