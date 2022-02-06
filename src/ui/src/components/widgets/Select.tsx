import './Select.css';
import { useCallback, useState } from 'react';

export function Select({
  label,
  value,
  style,
  items,
  onChange = null,
  onKeyDown = null,
  disabled = false,
}: {
  label: string;
  style: any;
  items: any;
  value: string | number;
  onChange?: any;
  onKeyDown?: any;
  disabled?: boolean;
}) {
  // const [open, setOpen] = useState(false);

  const doChange = (val: string | number) => {
    // console.log('doChange', val, open);
    // setOpen(false);
    onChange(val);
  };

  // const doToggle = (o: boolean) => {
  // console.log('open', open);
  // setOpen(!o);
  // };

  return (
    <details className="custom-select" style={style} onClick={() => console.log('clicked')}>
      <summary className="radios">
        {items.map((i: any) => (
          <input
            key={i}
            type="radio"
            checked={(Array.isArray(i) ? i[0] : i) === value}
            title={`[${label}] ${Array.isArray(i) ? i[1] : value}`}
            onChange={e => console.log('???', e)}
          />
        ))}
      </summary>
      <ul className="list">
        {items.map((i: any) => {
          const labelStyle = (Array.isArray(i) ? i[0] : i) === value ? { color: 'red' } : null;
          return (
            <li key={i}>
              <label onClick={() => doChange(i)} htmlFor={Array.isArray(i) ? i[0] : i} style={labelStyle}>
                {Array.isArray(i) ? i[1] : i}
              </label>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
