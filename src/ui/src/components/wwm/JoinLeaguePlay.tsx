import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGetAndSet } from 'react-context-hook';
import { useNavigate } from 'react-router';
import * as constants from '../../constants';
import { genPuzzlePlay } from '../../routes';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

async function joinLeague(leagueSlug: string, inviteCode: string = null) {
  const data = await fetch(genUrl('leagues/join'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
    body: JSON.stringify({
      league_slug: leagueSlug,
      invite_code: inviteCode,
    }),
  });
  return data;
}

export function JoinLeaguePlay() {
  const { leagueSlug, answerId } = useParams();
  const [error, setError] = useState('');
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');
  const navigate = useNavigate();

  async function join() {
    const data = await joinLeague(leagueSlug);
    const j = await data.json();
    if (data.status === 200) {
      navigate(genPuzzlePlay(leagueSlug, answerId));
    } else if (data.status === 403) {
      setError('You must be logged in to join a league');
    } else {
      setError(j.detail);
    }
  }

  useEffect(() => {
    if (leagueSlug && user) {
      join();
    }
  }, [leagueSlug, user]);

  if (!error.length) {
    return <div />;
  }

  return (
    <div style={{ width: '100%', height: '10rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {error.length ? (
        <div>
          <h1 style={{ color: 'red' }}>{error}</h1>
        </div>
      ) : null}
    </div>
  );
}
