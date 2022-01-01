import { Typography, Paper, Box } from '@mui/material';
import { useGetAndSet } from 'react-context-hook';
import * as constants from '../constants';
import { useEffect, useState } from 'react';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/user/${fn}`;

export function WWMBots() {
  const [user, setUser] = useGetAndSet('user');
  const [apikey, setApikey] = useState<string>('Loading...');

  async function apiKey() {
    const data = await fetch(genUrl('api_key'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
    });
    if (data.status === 200) {
      setApikey(await data.json());
    } else {
      setApikey('An error occurred');
    }
  }

  useEffect(() => {
    apiKey();
  }, [user]);

  return (
    <Paper sx={{ mb: 2, padding: '2em' }}>
      <Typography>
        <p>
          Words with Melvins supports an API for all actions that the user can take via the UI, and as a result, it is possible to make bots
          to play Words with Melvins. We ask that you limit bot usage to WWM Leagues that are expressly created for bot use. Regular players
          can join bot leagues if they'd like a challenge, but bots may NOT join leagues except those designated for them.
        </p>

        <p>
          Each league supports it's own list(s) of words that are used to check submissions and generate new puzzles. To make bot leagues an
          extra challenge, they generate puzzles from the full scrabble dictionary.
          <a href="https://github.com/rustybrooks/games/blob/main/src/api/data/sources/collins.2019.txt.clean">
            You can find this word list here:
          </a>
        </p>

        <p>
          I have written a dumb sample bot that uses our API. I'm going to let this serve as documentation for the time being, but I may add
          some additional docs when I get some time.
        </p>

        <p>
          I would recommend making a seperate account for your bot. Bot leagues have a LOT of puzzles per day and they will clog up your
          puzzle page otherwise. Once you make a new account you'll need your API key. Provided you're logged in right now, it should
          display right here:
          <br />
          <div css={{ background: '#eee', padding: '1em', display: 'inline-block' }}>
            {apikey === 'error' ? <Typography color="red">An error occurred</Typography> : apikey}
          </div>
        </p>
      </Typography>
    </Paper>
  );
}
