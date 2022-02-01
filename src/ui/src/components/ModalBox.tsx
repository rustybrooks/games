import { forwardRef, useState } from 'react';
import './widgets/ModalBox.css';

interface ModalProps {
  children: any;
  width: string;
  onClose: any;
  open: boolean;
}

export const ModalBox = forwardRef((props: ModalProps, ref: any) => {
  const openStyle = {};

  const closedStyle = {
    visibility: 'hidden',
  };

  return (
    <div className="modal-parent" style={props.open ? openStyle : closedStyle}>
      <div className="modal-background" onClick={props.onClose} />
      <div className="modal-sentinel" />
      <div tabIndex={0} data-test="sentinelStart" />
      <div className="modalbox" tabIndex={-1} style={{ width: props.width }} ref={ref}>
        {props.children}
      </div>
    </div>
  );
});
