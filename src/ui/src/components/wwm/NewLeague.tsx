import { useGetAndSet } from 'react-context-hook';
import { ChangeEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import * as constants from '../../constants';
import { debounce } from '../../utils';
import { TitleBox } from '../widgets/TitleBox';
import { genLeague } from '../../routes';

import { Button } from '../widgets/Button';
import { TextInput } from '../widgets/TextInput';
import { Select } from '../widgets/Select';

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
    const body = {
      league_name: leagueName,
      series_days: seriesDays,
      answer_interval_minutes: (24 * 60) / frequency,
      letters,
      max_guesses: guesses,
      time_to_live_hours: ttl,
      is_private: priv,
      is_hard_mode: hard,
    };
    console.log('post body', body);

    const r = await fetch(genUrl('leagues/add'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify(body),
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
        <TitleBox title="Unauthorized" width="40rem" style={{ margin: 'auto', marginTop: '5rem' }}>
          <div>You can not create leagues unless you are registered and logged in. Use the Login button at the top right to log in.</div>
        </TitleBox>
      </div>
    );
  }

  console.log('priv', priv, 'hard', hard);

  return (
    <div style={{ width: '90%', padding: '1rem' }}>
      <div>
        <TextInput
          value={leagueName}
          label="League Name"
          // margin="normal"
          style={{ width: '100%' }}
          onChange={leagueNameCallback}
          // error={Boolean(errors.leagueName)}
          // helperText={errors.leagueName}
          // autoFocus
        />

        <TextInput value={leagueSlug} label="League Slug" disabled style={{ width: '100%' }} />

        <div style={{ display: 'flex', marginTop: '.5rem' }}>
          <Select
            label="Number of letters"
            value={letters}
            style={{ width: '50%' }}
            onChange={(e: any) => setLetters(e)}
            items={[4, 5, 6, 7]}
          />
          <Select
            label="Number of guesses"
            value={guesses}
            style={{ m: 1, width: '50%' }}
            onChange={(e: any) => setGuesses(e)}
            items={[6, 7, 8]}
          />
        </div>

        <div style={{ display: 'flex', marginTop: '.5rem' }}>
          <Select
            label="Length of Series"
            value={seriesDays}
            style={{ m: 1, width: '33%' }}
            onChange={(event: any) => setSeriesDays(event.target.value)}
            items={[
              [7, 'Every Week'],
              [14, 'Every 2 weeks'],
              [21, 'Every 3 weeks'],
              [28, 'Every 4 weeks'],
            ]}
          />

          <Select
            label="Puzzle Frequency"
            value={frequency}
            style={{ m: 1, width: '33%' }}
            onChange={(event: any) => setFrequency(event.target.value)}
            items={[
              [1, 'Once a day'],
              [2, 'Twice a day'],
              [4, 'Four times a day'],
            ]}
          />

          <Select
            label="Puzzle time to live"
            value={ttl}
            style={{ m: 1, width: '34%' }}
            onChange={(event: any) => setTtl(event.target.value)}
            items={[
              [6, '6 hours'],
              [12, '12 hours'],
              [24, '1 day'],
              [48, '2 days'],
            ]}
          />
        </div>

        <div>
          {/* <FormControlLabel */}
          {/*  control={<Switch id="hard-mode" />} */}
          {/*  checked={hard} */}
          {/*  label="Hard Mode" */}
          {/*  style{{ m: 1 }} */}
          {/*  onChange={(event: any) => setHard(event.target.checked)} */}
          {/* /> */}
          {/* <FormControlLabel */}
          {/*  control={<Switch id="private" />} */}
          {/*  checked={priv} */}
          {/*  label="Private League" */}
          {/*  style{{ m: 1 }} */}
          {/*  onChange={(event: any) => setPriv(event.target.checked)} */}
          {/* /> */}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Button style={style.button} variant="contained" color="blue" onClick={createLeague}>
            Create League
          </Button>
        </div>
      </div>
    </div>
  );
}
