import './Button.css';

interface Props {
  size?: 'small' | 'medium' | 'large';
  color?: 'green' | 'red' | 'blue';
  disabled?: boolean;
  onClick?: any;
  children: any;
}

export function Button({ size = 'small', color = null, disabled = false, onClick = null, children = '' }: Props) {
  return (
    <button type="button" className={`${size} ${color || ''} button`} onClick={onClick}>
      {children}
    </button>
  );
}
