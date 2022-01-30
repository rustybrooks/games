import { Link, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useGetAndSet } from 'react-context-hook';
import * as constants from '../../constants';
import { League } from '../../../types/wwm';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

const Div = styled('div')``;

const style: { [id: string]: any } = {
  cell: {
    width: { mobile: '100px', tablet: '200px', desktop: '300px' },
    height: { mobile: '100px', tablet: '200px', desktop: '300px' },
    background: { mobile: 'cyan', tablet: 'blue', desktop: 'magenta' },
  },
};

async function joinLeague(leagueSlug: string, inviteCode: string) {
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

export function JoinLeague() {
  const { leagueSlug, inviteCode } = useParams();
  const [error, setError] = useState('');
  const [league, setLeague] = useState<League>();
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');

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
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  }

  return (
    <Div sx={{ width: '100%', height: '10rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {error.length ? (
        <Div sx={{}}>
          <Typography variant="h1" color="red">
            {error}
          </Typography>
        </Div>
      ) : (
        <Div sx={{}}>
          <Typography variant="h1">You have successfully joined league '{league.league_name}`</Typography>

          <Typography>
            <Link href={`/wwm/leagues/${leagueSlug}`}>You can visit the league page here</Link>
          </Typography>
        </Div>
      )}
    </Div>
  );
}
