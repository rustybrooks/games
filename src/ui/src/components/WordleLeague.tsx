import { useState, useEffect } from 'react';

import * as constants from '../constants';
import { League } from '../../types/wordle';
import { useGetAndSet } from 'react-context-hook';
import { Box, Button, Modal, Paper, Typography, Link } from '@mui/material';

import { useParams } from 'react-router-dom';
import { Div } from './Styled';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

export function WordleLeague({}) {
  const { leagueSlug } = useParams();
  const [league, setLeague] = useState<League>(null);

  console.log('render wordleleague', leagueSlug, league);

  async function getLeague() {
    const r = await fetch(genUrl('leagues/info'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_slug: leagueSlug,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();
      setLeague(data);
    }
  }

  useEffect(() => {
    getLeague();
  }, [leagueSlug]);

  if (!league) {
    return <Div>Loading</Div>;
  }

  return (
    <Div>
      {Object.keys(league).map((k: keyof League) => (
        <div>{[k, league[k]]}</div>
      ))}
    </Div>
  );
}
