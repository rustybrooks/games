import './TextInput.css';

export function TextInput({
  label,
  value,
  style,
  onChange = null,
  onKeyDown = null,
  disabled = false,
}: {
  label: string;
  style: any;
  value: string | number;
  onChange?: any;
  onKeyDown?: any;
  disabled?: boolean;
}) {
  return (
    <input
      className="text-input"
      type="text"
      disabled={disabled}
      value={value}
      style={style}
      placeholder={label}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
}
