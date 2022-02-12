import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useGetAndSet } from 'react-context-hook';
import * as constants from '../../constants';
import { League } from '../../../types/wwm';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

async function joinLeague(leagueSlug: string, inviteCode: string) {
  return fetch(genUrl('leagues/join'), {
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
}

export function JoinLeague() {
  const { leagueSlug, inviteCode } = useParams();
  const [error, setError] = useState('');
  const [league, setLeague] = useState<League>();
  const [user]: [{ username: string }, any] = useGetAndSet('user');

  const join = useCallback(async () => {
    const data = await joinLeague(leagueSlug, inviteCode);
    const j = await data.json();
    if (data.status === 200) {
      setLeague(j);
    } else if (data.status === 403) {
      setError('You must be logged in to join a league');
    } else {
      setError(j.detail);
    }
  }, [inviteCode, leagueSlug]);

  useEffect(() => {
    if (leagueSlug && user) {
      join();
    }
  }, [leagueSlug, inviteCode, user, join]);

  if (!error.length && !league) {
    return (
      <div>
        <h3>Loading...</h3>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '10rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {error.length ? (
        <div>
          <h1>{error}</h1>
        </div>
      ) : (
        <div>
          <h1>You have successfully joined league '{league.league_name}`</h1>

          <Link to={`/wwm/leagues/${leagueSlug}`}>You can visit the league page here</Link>
        </div>
      )}
    </div>
  );
}
