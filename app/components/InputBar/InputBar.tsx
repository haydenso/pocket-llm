'use client';

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
}

export function InputBar({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Type your message here...',
}: InputBarProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="input-area">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Message input"
      />
      <button onClick={onSend} disabled={disabled}>
        Send
      </button>
    </div>
  );
}
