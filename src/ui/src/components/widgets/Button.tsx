import './Button.css';

interface Props {
  size?: 'small' | 'medium' | 'large';
  color?: 'green' | 'red' | 'blue';
  disabled?: boolean;
  variant?: string;
  style?: any;
  onClick?: any;
  children: any;
}

export function Button({
  size = 'small',
  color = null,
  disabled = false,
  onClick = null,
  children = '',
  variant = 'outlined',
  style = null,
}: Props) {
  return (
    <button type="button" className={`${size} ${color || ''} ${variant} button`} style={style || {}} onClick={onClick}>
      {children}
    </button>
  );
}
