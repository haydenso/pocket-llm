'use client';

interface ProgressBarProps {
  progress: number;
  visible: boolean;
}

export function ProgressBar({ progress, visible }: ProgressBarProps) {
  if (!visible) return null;

  return (
    <div className="progress-container">
      <div className="progress-label">Downloading model...</div>
      <progress max="100" value={progress} />
    </div>
  );
}
