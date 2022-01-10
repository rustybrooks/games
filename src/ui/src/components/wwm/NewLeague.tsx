import { useGetAndSet } from 'react-context-hook';
import { Box, Button, FormControlLabel, FormGroup, MenuItem, Switch, TextField, Typography } from '@mui/material';
import { ChangeEvent, FormEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import * as constants from '../../constants';
import { Div } from '../Styled';
import { debounce } from '../../utils';
import { TitleBox } from '../TitleBox';
import { genLeague } from '../../routes';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

const style = {
  button: {
    margin: '10px',
  },
};

export function NewLeague() {
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');
  const [leagueName, setLeagueName] = useState('');
  const [leagueSlug, setLeagueSlug] = useState('');
  const [errors, setErrors]: [{ leagueName?: string; leagueSlug?: string }, any] = useState({});
  const [letters, setLetters] = useState(5);
  const [guesses, setGuesses] = useState(6);
  const [frequency, setFrequency] = useState(1);
  const [seriesDays, setSeriesDays] = useState(7);
  const [ttl, setTtl] = useState(24);
  const [priv, setPriv] = useState(false);
  const [hard, setHard] = useState(false);
  const navigate = useNavigate();

  const leagueNameValidate = useCallback(
    debounce(async (ln): Promise<void> => {
      console.log('validate!!');
      const r = await fetch(genUrl('leagues/check'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': localStorage.getItem('api-key'),
        },
        body: JSON.stringify({
          league_name: ln,
        }),
      });
      if (r.status === 200) {
        setErrors({});
        setLeagueSlug((await r.json()).league_slug);
      } else {
        setErrors({ ...errors, leagueName: (await r.json()).detail });
      }
    }, 500),
    [],
  );

  const createLeague = useCallback(async () => {
    const r = await fetch(genUrl('leagues/add'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_name: leagueName,
        series_days: seriesDays,
        answer_interval_minutes: (24 * 60) / frequency,
        letters,
        max_guesses: guesses,
        time_to_live_hours: ttl,
        is_private: priv,
        is_hard_mode: hard,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();
      setErrors({});
      navigate(genLeague(data.league_slug));
    } else {
      setErrors({ ...errors, leagueName: (await r.json()).detail });
    }
  }, [errors, frequency, guesses, hard, leagueName, letters, navigate, priv, seriesDays, ttl]);

  const leagueNameCallback = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setLeagueName(event.target.value);
      leagueNameValidate(event.target.value);
    },
    [leagueNameValidate],
  );

  if (!user) {
    return (
      <div>
        <TitleBox title="Unauthorized" width="40rem" sx={{ margin: 'auto', marginTop: '5rem' }}>
          <Div>
            <Typography>
              You can not create leagues unless you are registered and logged in. Use the Login button at the top right to log in.
            </Typography>
          </Div>
        </TitleBox>
      </div>
    );
  }

  return (
    <Div sx={{ width: '100%' }}>
      <Box component="form" sx={{ m: 1 }}>
        <TextField
          id="league-name"
          value={leagueName}
          label="League Name"
          margin="normal"
          sx={{ m: 1, width: '90%' }}
          onChange={leagueNameCallback}
          error={Boolean(errors.leagueName)}
          helperText={errors.leagueName}
          autoFocus
        />

        <TextField id="league-slug" value={leagueSlug} label="League Slug" margin="normal" disabled sx={{ m: 1, width: '90%' }} />

        <FormGroup row>
          <TextField
            select
            id="letters"
            label="Number of letters"
            value={letters}
            margin="normal"
            sx={{ m: 1, width: '44%' }}
            onChange={(event: any) => setLetters(event.target.value)}
          >
            <MenuItem value={4}>4</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={6}>6</MenuItem>
            <MenuItem value={7}>7</MenuItem>
          </TextField>

          <TextField
            select
            id="max-guesses"
            label="Number of guesses"
            value={guesses}
            margin="normal"
            sx={{ m: 1, width: '44%' }}
            onChange={(event: any) => setGuesses(event.target.value)}
          >
            <MenuItem value={6}>6</MenuItem>
            <MenuItem value={7}>7</MenuItem>
            <MenuItem value={8}>8</MenuItem>
          </TextField>
        </FormGroup>

        <FormGroup row>
          <TextField
            select
            id="series-days"
            label="Length of Series"
            value={seriesDays}
            margin="normal"
            sx={{ m: 1, width: '29%' }}
            onChange={(event: any) => setSeriesDays(event.target.value)}
          >
            <MenuItem value={7}>Every week</MenuItem>
            <MenuItem value={14}>Every 2 weeks</MenuItem>
            <MenuItem value={21}>Every 3 weeks</MenuItem>
            <MenuItem value={28}>Every 4 weeks</MenuItem>
          </TextField>

          <TextField
            select
            id="puzzle-frequency"
            label="Puzzle Frequency"
            value={frequency}
            margin="normal"
            sx={{ m: 1, width: '29%' }}
            onChange={(event: any) => setFrequency(event.target.value)}
          >
            <MenuItem value={1}>Once a day</MenuItem>
            <MenuItem value={2}>Twice a day</MenuItem>
            <MenuItem value={4}>Four times a day</MenuItem>
          </TextField>

          <TextField
            select
            id="time-to-live"
            label="Puzzle time to live"
            value={ttl}
            margin="normal"
            sx={{ m: 1, width: '29%' }}
            onChange={(event: any) => setTtl(event.target.value)}
          >
            <MenuItem value={6}>6 hours</MenuItem>
            <MenuItem value={12}>12 hours</MenuItem>
            <MenuItem value={24}>1 day</MenuItem>
            <MenuItem value={48}>2 days</MenuItem>
          </TextField>
        </FormGroup>

        <FormGroup row>
          <FormControlLabel
            control={<Switch id="hard-mode" />}
            value={hard}
            label="Hard Mode"
            sx={{ m: 1 }}
            onChange={(event: any) => setHard(event.target.value)}
          />
          <FormControlLabel control={<Switch id="private" />} value={priv} label="Private League" sx={{ m: 1 }} />
        </FormGroup>

        <Div sx={{ textAlign: 'right' }}>
          <Button
            css={style.button}
            variant="contained"
            color="primary"
            onClick={createLeague}
            onChange={(event: any) => setPriv(event.target.value)}
          >
            Create League
          </Button>
        </Div>
      </Box>
    </Div>
  );
}
