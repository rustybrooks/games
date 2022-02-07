import './TextInput.css';

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
  );
}
