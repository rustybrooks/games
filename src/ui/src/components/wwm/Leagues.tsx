import { useEffect, useState } from 'react';
import { useGetAndSet } from 'react-context-hook';
import { Link } from 'react-router-dom';
import * as dt from '../widgets/DataTable';
import { ActivePuzzle, League } from '../../../types';
import * as constants from '../../constants';
import { genLeagueNew } from '../../routes';
import { formatDistance } from '../../utils';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

export async function getPuzzles(
  active = true,
  all = true,
  league_slug: string = null,
  played: boolean = null,
  limit: number = null,
): Promise<ActivePuzzle[]> {
  const body: any = {
    active,
    all,
    limit,
    played,
    sort: active ? 'active_after' : '-active_before',
  };
  if (league_slug) {
    body.league_slug = league_slug;
  }

  const data = await fetch(genUrl('puzzles/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
    body: JSON.stringify(body),
  });
  return data.json();
}

function dateFormatter(row: League, d: string) {
  return formatDistance(new Date(d), new Date());
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

function leagueFormatter(row: League, d: string) {
  return <Link to={`/wwm/leagues/${row.league_slug}`}>{d}</Link>;
}

const ourheadCells: dt.HeadCell<League>[] = [
  {
    id: 'league_name',
    numeric: false,
    disablePadding: false,
    label: 'League',
    formatter: leagueFormatter,
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

function WWMLeaguesX() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [user]: [{ username: string }, any] = useGetAndSet('user');

  async function joinLeague(row: League): Promise<void> {
    await fetch(genUrl('leagues/join'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_slug: row.league_slug,
      }),
    });
    setLeagues(await getLeagues());
  }

  async function leaveLeague(row: League): Promise<void> {
    await fetch(genUrl('leagues/leave'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_slug: row.league_slug,
      }),
    });
    setLeagues(await getLeagues());
  }

  function canLeave(row: League): boolean {
    return !row.is_creator;
  }

  function canJoin(row: League): boolean {
    return !row.is_member && user !== null;
  }

  useEffect(() => {
    (async () => {
      setLeagues(await getLeagues());
    })();
  }, [user]);

  if (!leagues) {
    return <h3>Loading...</h3>;
  }

  function buttonCallback(row: League): dt.ButtonInfo<League> {
    if (!row.is_member) {
      return { label: 'Join', callback: joinLeague, activeCallback: () => canJoin(row) };
    }
    return { label: 'Leave', callback: leaveLeague, activeCallback: () => canLeave(row) };
  }

  return (
    <div style={{ width: '100%' }}>
      <div>
        <p style={{ padding: '10px' }}>
          These are all the available leagues that you can join, along with details about the conditions of the league. You need to have an
          account and be logged in to join a league. Once you join a league new puzzles will appear on the league's schedule and will remain
          active for the period defined for the league. If you don't see anything that interests you here, or you'd like to have a private
          league, <Link to={genLeagueNew()}>you can create a new league here.</Link>
        </p>
      </div>
      <dt.DataTable
        rows={leagues}
        headCells={ourheadCells}
        mainColumn="league_slug"
        initialSortColumn="league_name"
        rowButtons={[buttonCallback]}
        storageKey="leagues"
      />
    </div>
  );
}

export const Leagues = WWMLeaguesX;
