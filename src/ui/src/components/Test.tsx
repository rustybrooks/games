import { Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const Div = styled('div')``;

let style: { [id: string]: any } = {
  cell: {
    width: { mobile: '100px', tablet: '200px', desktop: '300px' },
    height: { mobile: '100px', tablet: '200px', desktop: '300px' },
    background: { mobile: 'cyan', tablet: 'blue', desktop: 'magenta' },
  },
};

export function Test() {
  return (
    <Div sx={style.cell}>
      <Typography variant="h1">XXX</Typography>
    </Div>
  );
}
