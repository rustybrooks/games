import * as React from 'react';
import { useGetAndSet } from 'react-context-hook';
import * as eht from './EnhancedTable';
import { League } from '../../types/wordle';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import * as constants from '../constants';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

const ourheadCells: eht.HeadCell<League>[] = [
  // {
  //   id: 'league_slug',
  //   numeric: false,
  //   disablePadding: true,
  //   label: 'slug',
  // },
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
  {
    id: 'create_date',
    numeric: false,
    disablePadding: false,
    label: 'Created',
  },
  {
    id: 'start_date',
    numeric: false,
    disablePadding: false,
    label: 'Starts',
  },
];

/// ///////////////////////

const WordleLeaguesX = () => {
  const [leagues, setLeagues] = React.useState<League[]>([]);
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');

  async function getLeagues(): Promise<League[]> {
    const data = await fetch(genUrl('leagues'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
    });
    return data.json();
  }

  React.useEffect(() => {
    async function fetchMyAPI() {
      const l = await getLeagues();
      console.log('leagues', l);
      setLeagues(l);
    }

    fetchMyAPI();
  }, [user]);

  if (!leagues) {
    return <div>Loading...</div>;
  }
  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <div>
        <Typography>
          These are all the available leagues that you can join, along with details about the conditions of the league. Any league with a
          checkbox is one you can join.
        </Typography>
      </div>
      <eht.EnhancedTable
        title="Leagues"
        rows={leagues}
        headCells={ourheadCells}
        mainColumn={'league_slug'}
        initialSortColumn={'league_name'}
      />
    </Paper>
  );
};

export const WordleLeagues = WordleLeaguesX;
