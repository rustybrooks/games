import { forwardRef, useState } from 'react';
import './Modal.css';

interface ModalProps {
  children: any;
  open: boolean;
  onClose: any;
}

export const Modal = forwardRef((props: ModalProps, ref: any) => {
  const [open, setOpen] = useState(props.open);

  const open_style = {
    // transform: 'none',
    // transition: 'transform 225ms cubic-bezier(0, 0, 0.2, 1) 0ms',
  };

  const closed_style = {
    visibility: 'hidden',
  };

  return (
    <div className="modal-thing" ref={ref} style={open ? open_style : closed_style}>
      {props.children}
    </div>
  );
});
