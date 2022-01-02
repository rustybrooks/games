import { forwardRef } from 'react';
import { Box, Typography, Container } from '@mui/material';

const style: { [id: string]: any } = {
  modalBox: {
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    margin: '.3rem',
    // boxShadow: 24,
    // p: 4,
  },
};

interface PropsTypes {
  children: any;
  width?: string;
  title: string;
  titleBackground?: string;
}

export const TitleBox = forwardRef((props: PropsTypes, ref: any) => {
  const bg = props.titleBackground || '#ccc';

  return (
    <Box tabIndex={-1} sx={{ ...style.modalBox, width: props.width }} ref={ref}>
      <Container sx={{ background: bg, width: '100%', padding: '.25rem' }}>
        <Typography>{props.title}</Typography>
      </Container>
      <Box sx={{ padding: '.5rem' }}>{props.children}</Box>
    </Box>
  );
});
