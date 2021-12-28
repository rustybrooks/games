import * as React from 'react';
import { useGetAndSet } from 'react-context-hook';
import { Typography, Paper } from '@mui/material';
import { formatDistance } from 'date-fns';
import * as eht from './EnhancedTable';
import { ActivePuzzle, League } from '../../types/wordle';
import * as constants from '../constants';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

function dateFormatter(row: League, d: string) {
  return formatDistance(new Date(d), new Date(), { addSuffix: true });
}

// move this to utils or something
export async function getLeagues(): Promise<League[]> {
  const data = await fetch(genUrl('leagues'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
  });
  return data.json();
}

export async function getActivePuzzles(): Promise<ActivePuzzle[]> {
  const data = await fetch(genUrl('active_puzzles'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
  });
  return data.json();
}

const ourheadCells: eht.HeadCell<League>[] = [
  {
    id: 'league_name',
    numeric: false,
    disablePadding: false,
    label: 'League',
  },
  {
    id: 'letters',
    numeric: true,
    disablePadding: false,
    label: '# letters',
  },
  {
    id: 'max_guesses',
    numeric: true,
    disablePadding: false,
    label: '# guesses',
  },
  {
    id: 'series_days',
    numeric: true,
    disablePadding: false,
    label: 'Days in series',
  },
  {
    id: 'time_to_live_hours',
    numeric: true,
    disablePadding: false,
    label: 'TTL (hours)',
  },
  // { id: 'create_date', numeric: false, disablePadding: false, label: 'Created', formatter: dateFormatter },
  {
    id: 'start_date',
    numeric: false,
    disablePadding: false,
    label: 'Starts',
    formatter: dateFormatter,
  },
];

/// ///////////////////////

const WordleLeaguesX = () => {
  const [leagues, setLeagues] = useGetAndSet<League[]>('leagues');
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');

  async function joinLeague(row: League): Promise<void> {
    console.log('join', row);
    const data = await fetch(genUrl('join_league'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_slug: row.league_slug,
      }),
    });
    console.log('join data', data);
    setLeagues(await getLeagues());
  }

  async function leaveLeague(row: League): Promise<void> {
    console.log('leave', row);
    console.log('join', row);
    const data = await fetch(genUrl('leave_league'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_slug: row.league_slug,
      }),
    });
    console.log('leave data', data);
    setLeagues(await getLeagues());
  }

  function canLeave(row: League): boolean {
    return row.is_member && user !== null;
  }

  function canJoin(row: League): boolean {
    return !row.is_member && user !== null;
  }

  React.useEffect(() => {
    (async () => {
      setLeagues(await getLeagues());
    })();
  }, [user]);

  if (!leagues) {
    return <Typography variant="h3">Loading...</Typography>;
  }
  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <div>
        <Typography sx={{ padding: '10px' }}>
          These are all the available leagues that you can join, along with details about the conditions of the league. You need to have an
          account and be logged in to join a league. Once you join a league new puzzles will appear on the league's schedule and will remain
          active for the period defined for the league.
        </Typography>
      </div>
      <eht.EnhancedTable
        rows={leagues}
        headCells={ourheadCells}
        mainColumn={'league_slug'}
        initialSortColumn={'league_name'}
        checkButtons={false}
        rowButtons={[
          ['Join', joinLeague, canJoin],
          ['Leave', leaveLeague, canLeave],
        ]}
      />
    </Paper>
  );
};

export const WordleLeagues = WordleLeaguesX;
