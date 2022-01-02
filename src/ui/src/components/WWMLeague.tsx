import { useEffect, useState } from 'react';
import * as eht from './EnhancedTable';

import * as constants from '../constants';
import { League, LeagueSeries, LeagueStats } from '../../types/wwm';
import { useGetAndSet } from 'react-context-hook';
import { Link } from '@mui/material';

import { useParams } from 'react-router-dom';
import { Div, Table, Td, Tr } from './Styled';
import { formatDistance } from 'date-fns';
import { TitleBox } from './TitleBox';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

const ff = ['Roboto', 'Arial', 'sans-serif'].join(',');

const style: { [id: string]: any } = {
  table: {},
  tdHead: {
    padding: '5px',
    margin: '3px',
    fontWeight: 'bold',
    fontFamily: ff,
    textAlign: 'right',
    background: '#cce',
  },
  tdData: {
    padding: '5px',
    margin: '3px',
    fontFamily: ff,
    textAlign: 'left',
    background: '#eee',
  },
};

function dateFormatter(row: any, d: string) {
  return formatDistance(new Date(d), new Date(), { addSuffix: true });
}

function floatFormatter2(row: any, d: any) {
  return d !== null ? d.toFixed(2) : null;
}

function intFormatter(row: any, d: any) {
  return d !== null ? d.toFixed(0) : null;
}

function pctFormatter(row: any, d: any) {
  return d !== null ? `${(d * 100).toFixed(1)}%` : null;
}

const seriesHeadCells: eht.HeadCell<LeagueSeries>[] = [
  {
    id: 'start_date',
    numeric: false,
    disablePadding: false,
    label: 'Start',
    formatter: dateFormatter,
  },
  {
    id: 'end_date',
    numeric: false,
    disablePadding: false,
    label: 'End',
    formatter: dateFormatter,
  },
];

const statsHeadCells: eht.HeadCell<LeagueStats>[] = [
  {
    id: 'username',
    numeric: false,
    disablePadding: false,
    label: 'User',
  },
  {
    id: 'score',
    numeric: true,
    disablePadding: false,
    label: 'score',
    formatter: floatFormatter2,
  },
  // {
  //   id: 'raw_score',
  //   numeric: true,
  //   disablePadding: false,
  //   label: 'raw score',
  //   formatter: intFormatter,
  // },
  // {
  //   id: 'avg_guesses',
  //   numeric: true,
  //   disablePadding: false,
  //   formatter: floatFormatter2,
  // },
  {
    id: 'min_guesses_correct',
    numeric: true,
    disablePadding: false,
    label: 'min guesses (correct)',
    formatter: intFormatter,
  },
  {
    id: 'avg_guesses_correct',
    numeric: true,
    disablePadding: false,
    label: 'avg guesses (correct)',
    formatter: floatFormatter2,
  },
  // {
  //   id: 'max_guesses',
  //   numeric: true,
  //   disablePadding: false,
  //   label: 'max guesses',
  //   formatter: intFormatter,
  // },
  {
    id: 'done',
    numeric: true,
    disablePadding: false,
    label: 'complete',
    formatter: intFormatter,
  },
  {
    id: 'wins',
    numeric: true,
    disablePadding: false,
    label: 'wins',
    formatter: intFormatter,
  },
  {
    id: 'possible',
    numeric: true,
    disablePadding: false,
    label: 'possible',
    formatter: intFormatter,
  },
  {
    id: 'win_pct',
    numeric: true,
    disablePadding: false,
    label: 'win%',
    formatter: pctFormatter,
  },
  {
    id: 'win_pct_possible',
    numeric: true,
    disablePadding: false,
    label: 'win% of possible',
    formatter: pctFormatter,
  },
];

export function WWMLeagueSeries({ league, seriesCallback }: { league: League; seriesCallback: any }) {
  const [series, setSeries] = useState<LeagueSeries[]>(null);

  async function getLeagueSeries() {
    const r = await fetch(genUrl('leagues/series'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_slug: league.league_slug,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();
      setSeries(data);
      if (data.length) {
        seriesCallback(data[0]);
      }
    }
  }

  useEffect(() => {
    if (league) {
      getLeagueSeries();
    }
  }, [league]);

  if (!series) {
    return <Div>Loading</Div>;
  }

  async function navStats(row: LeagueSeries): Promise<void> {
    seriesCallback(row);
  }

  function buttonCallback(row: LeagueSeries): eht.ButtonInfo<LeagueSeries> {
    return { label: 'Show', callback: navStats, activeCallback: () => true };
  }

  return (
    <TitleBox title="League Series">
      <eht.EnhancedTable
        rows={series}
        headCells={seriesHeadCells}
        mainColumn="start_date"
        initialSortColumn="start_date"
        initialSortOrder="desc"
        rowButtons={[buttonCallback]}
        initialRowsPerPage={10}
        minWidth="10rem"
      />
    </TitleBox>
  );
}

export function WWMLeagueSeriesStats({ league, series }: { league: League; series: LeagueSeries }) {
  const [stats, setStats] = useState<LeagueStats[]>(null);

  async function getLeagueStats() {
    const r = await fetch(genUrl('leagues/series_stats'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        league_slug: league.league_slug,
        wordle_league_series_id: series.wordle_league_series_id,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();
      setStats(data);
    }
  }

  useEffect(() => {
    if (league && series) {
      getLeagueStats();
    }
  }, [league, series]);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const d1 = formatDistance(new Date(series.start_date), new Date(), { addSuffix: true });
  const d2 = formatDistance(new Date(series.end_date), new Date(), { addSuffix: true });

  return (
    <TitleBox title={`Series Stats - ${d1} to ${d2}`}>
      <eht.EnhancedTable
        rows={stats}
        headCells={statsHeadCells}
        mainColumn={'username'}
        initialSortColumn="score"
        initialSortOrder="desc"
        rowButtons={[]}
        initialRowsPerPage={25}
      />
    </TitleBox>
  );
}

export function WWMLeagueInfo({ league }: { league: League }) {
  const inviteLink = `${constants.BASE_URL}/wwm/leagues/${league.league_slug}/join${league.is_private ? `/${league.invite_code}` : ''}`;

  return (
    <TitleBox title={league.league_name} width="25rem">
      <Table sx={style.table}>
        <tbody>
          <Tr>
            <Td sx={style.tdHead}>Created</Td>
            <Td sx={style.tdData}>{formatDistance(new Date(league.create_date), new Date(), { addSuffix: true })}</Td>
            <Td sx={style.tdHead}>Series Length</Td>
            <Td sx={style.tdData}>{league.series_days} days</Td>
          </Tr>
          <Tr>
            <Td sx={style.tdHead}>Letters</Td>
            <Td sx={style.tdData}>{league.letters}</Td>
            <Td sx={style.tdHead}>Max Guesses</Td>
            <Td sx={style.tdData}>{league.max_guesses}</Td>
          </Tr>
          <Tr>
            <Td sx={style.tdHead}>Puzzle Lifetime</Td>
            <Td sx={style.tdData}>{league.time_to_live_hours} hours</Td>
            <Td sx={style.tdHead}>Hard Mode</Td>
            <Td sx={style.tdData}>{league.is_hard_mode ? 'yes' : 'no'}</Td>
          </Tr>
          <Tr>
            <Td sx={style.tdData} colSpan={2}>
              League is: {league.is_private ? 'private' : 'public'}
              {league.is_private ? (
                <span>
                  &nbsp; (<a href={inviteLink}>Invite Link</a>)
                </span>
              ) : null}
            </Td>
            <Td sx={style.tdData} colSpan={2}>
              You are {league.is_member ? '' : 'not'} a member
              {league.is_member ? null : (
                <span>
                  &nbsp; (<Link href={inviteLink}>Join Now</Link>)
                </span>
              )}
            </Td>
          </Tr>
        </tbody>
      </Table>
    </TitleBox>
  );
}

export function WWMLeague() {
  const { leagueSlug } = useParams();
  const [league, setLeague] = useState<League>(null);
  const [series, setSeries] = useState<LeagueSeries>(null);
  const [user, setUser] = useGetAndSet('user');

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
  }, [leagueSlug, user]);

  if (!league) {
    return <Div>Loading</Div>;
  }

  return (
    <Div>
      <table>
        <tbody>
          <tr>
            <td valign="top">
              <WWMLeagueInfo league={league} />
              <WWMLeagueSeries league={league} seriesCallback={setSeries} />
            </td>
            <td valign="top">
              <WWMLeagueSeriesStats league={league} series={series} />
            </td>
          </tr>
        </tbody>
      </table>
    </Div>
  );
}
