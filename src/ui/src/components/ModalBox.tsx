import { forwardRef } from 'react';
import { Box } from '@mui/material';

const style: { [id: string]: any } = {
  modalBox: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  },
};

interface ModalProps {
  children: any;
  width: string;
}

export const ModalBox = forwardRef((props: ModalProps, ref: any) => {
  return (
    <Box tabIndex={-1} sx={{ ...style.modalBox, width: props.width }} ref={ref}>
      {props.children}
    </Box>
  );
});
