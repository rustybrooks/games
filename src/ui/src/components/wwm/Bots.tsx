import { useGetAndSet } from 'react-context-hook';
import { useEffect, useState } from 'react';
import * as constants from '../../constants';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/user/${fn}`;

export function Bots() {
  const [user] = useGetAndSet('user');
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
    <div style={{ padding: '2em' }}>
      <p>
        Words with Melvins supports an API for all actions that the user can take via the UI, and as a result, it is possible to make bots
        to play Words with Melvins. We ask that you limit bot usage to WWM Leagues that are expressly created for bot use. Regular players
        can join bot leagues if they'd like a challenge, but bots may NOT join leagues except those designated for them.
      </p>

      <p>
        Each league supports it's own list(s) of words that are used to check submissions and generate new puzzles. To make bot leagues an
        extra challenge, they generate puzzles from the full scrabble dictionary.&nbsp;
        <a href="https://github.com/rustybrooks/games/blob/main/src/api/data/sources/collins.2019.txt.clean">
          You can find this word list here:
        </a>
      </p>

      <p>
        I have written a dumb sample bot that uses our API. I'm going to let this serve as documentation for the time being, but I may add
        some additional docs when I get some time. The sample bot does very little error checking and it's not very efficient with it's use
        of data. But it's not terrible and it is designed to be run once, to find the first puzzle in the new bot league, and try to "solve"
        it. Of course it just makes random guesses and ignores the feedback. Please look at comments in the bot code for an explanation of
        anything I think is relevant.&nbsp;
        <a href="https://github.com/rustybrooks/games/blob/main/sample_bot.py">The sample bot is here.</a>
      </p>

      <p>
        I would recommend making a seperate account for your bot. Bot leagues have a LOT of puzzles per day and they will clog up your
        puzzle page otherwise. Once you make a new account you'll need your API key. Provided you're logged in right now, it should display
        right here:
        <br />
        <div style={{ background: '#eee', padding: '1em', display: 'inline-block' }}>
          {apikey === 'error' ? <p style={{ color: 'red' }}>An error occurred</p> : apikey}
        </div>
      </p>

      <p>
        Finally, the bot is private and invite-only. This is mostly just to keep it from showing up on the normal list of leagues. You can
        join it by <a href="/wwm/leagues/bot_league_5l_5m/join/2769c9d5bc36963071208acacd09468c">following this link</a> (assuming you're
        logged in). Once you're in the league you can leave it from the league page like normal, and allllll its puzzles will show up. So I
        really recommend joining it as a separate user made just for your bot.
      </p>
    </div>
  );
}
