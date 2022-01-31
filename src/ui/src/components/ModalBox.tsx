import { forwardRef } from 'react';
import './ModalBox.css';

interface ModalProps {
  children: any;
  width: string;
}

export const ModalBox = forwardRef((props: ModalProps, ref: any) => {
  return (
    <div className="modalbox" tabIndex={-1} style={{ width: props.width }} ref={ref}>
      {props.children}
    </div>
  );
});
