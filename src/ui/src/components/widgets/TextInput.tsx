import './TextInput.css';
import { useEffect, useRef } from 'react';

export function TextInput({
  label,
  value = '',
  style = null,
  onChange = null,
  onKeyDown = null,
  disabled = false,
  error = false,
  helperText = null,
  autoFocus = false,
  type = 'text',
}: {
  label: string;
  style?: any;
  value?: string | number;
  onChange?: any;
  onKeyDown?: any;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  autoFocus?: boolean;
  type?: string;
}) {
  return (
    <div className="text-input">
      <input
        className="text-input"
        autoFocus={autoFocus}
        type={type}
        disabled={disabled}
        value={value}
        style={style}
        placeholder={label}
        onChange={onChange}
      />
      {error ? <p className="text-input-error">{helperText}</p> : null}
    </div>
  );
}
