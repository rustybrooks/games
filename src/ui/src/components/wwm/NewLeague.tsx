import { useGetAndSet } from 'react-context-hook';
import { Box, Button, FormControlLabel, FormGroup, MenuItem, Switch, TextField } from '@mui/material';
import { Div } from '../Styled';

const style = {
  button: {
    margin: '10px',
  },
};

export function NewLeague() {
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');

  return (
    <Div sx={{ width: '80%' }}>
      <Box component="form" sx={{ m: 1 }}>
        <TextField id="league-name" value="" label="League Name" margin="normal" sx={{ m: 1, width: '90%' }} />

        <TextField id="league-slug" value="" label="League Slug" margin="normal" disabled sx={{ m: 1, width: '90%' }} />

        <FormGroup row>
          <TextField select id="letters" label="Number of letters" value={5} margin="normal" sx={{ m: 1, width: '44%' }}>
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={6}>6</MenuItem>
            <MenuItem value={7}>7</MenuItem>
          </TextField>

          <TextField select id="max-guesses" label="Number of guesses" value={6} margin="normal" sx={{ m: 1, width: '44%' }}>
            <MenuItem value={6}>6</MenuItem>
            <MenuItem value={7}>7</MenuItem>
            <MenuItem value={8}>8</MenuItem>
          </TextField>
        </FormGroup>

        <FormGroup row>
          <TextField select id="series-days" label="Length of Series" value={7} margin="normal" sx={{ m: 1, width: '29%' }}>
            <MenuItem value={7}>Every week</MenuItem>
            <MenuItem value={14}>Every 2 weeks</MenuItem>
            <MenuItem value={21}>Every 3 weeks</MenuItem>
            <MenuItem value={28}>Every 4 weeks</MenuItem>
          </TextField>

          <TextField select id="puzzle-frequency" label="Puzzle Frequency" value={1} margin="normal" sx={{ m: 1, width: '29%' }}>
            <MenuItem value={1}>Once a day</MenuItem>
            <MenuItem value={2}>Twice a day</MenuItem>
            <MenuItem value={4}>Four times a day</MenuItem>
          </TextField>

          <TextField select id="time-to-live" label="Puzzle time to live" value={24} margin="normal" sx={{ m: 1, width: '29%' }}>
            <MenuItem value={6}>6 hours</MenuItem>
            <MenuItem value={12}>12 hours</MenuItem>
            <MenuItem value={24}>1 day</MenuItem>
            <MenuItem value={48}>2 days</MenuItem>
          </TextField>
        </FormGroup>

        <FormGroup row>
          <FormControlLabel control={<Switch id="hard-mode" />} label="Hard Mode" sx={{ m: 1 }} />
          <FormControlLabel control={<Switch id="hard-mode" />} label="Private League" sx={{ m: 1 }} />
        </FormGroup>

        <Div sx={{ textAlign: 'right' }}>
          <Button css={style.button} variant="contained" color="primary">
            Create League
          </Button>
        </Div>
      </Box>
    </Div>
  );
}
