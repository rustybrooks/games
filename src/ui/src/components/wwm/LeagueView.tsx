import { useEffect, useState } from 'react';
import { useGetAndSet } from 'react-context-hook';
import { Link, useParams } from 'react-router-dom';
import { useNavigate } from 'react-router';
import * as dt from '../widgets/DataTable';

import * as constants from '../../constants';
import { ActivePuzzle, League, LeagueSeries, LeagueStats, User } from '../../../types';

import { TitleBox } from '../widgets/TitleBox';
import { getPuzzles } from './Leagues';
import { formatDistance } from '../../utils';
import { genUser } from '../../routes';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

const ff = ['Roboto', 'Arial', 'sans-serif'].join(',');
type EnumeratedPuzzle = ActivePuzzle & { count: number };

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

async function getLeague(leagueSlug: string) {
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
    return r.json();
  }
  return null;
}

function dateFormatter(row: any, d: string) {
  return formatDistance(new Date(d), new Date());
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

const seriesHeadCells: dt.HeadCell<LeagueSeries>[] = [
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

const statsHeadCells: dt.HeadCell<LeagueStats>[] = [
  {
    id: 'username',
    numeric: false,
    disablePadding: false,
    label: 'User',
    formatter: row => <Link to={genUser(row.username)}>{row.username}</Link>,
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
  {
    id: 'min_guesses_correct',
    numeric: true,
    disablePadding: false,
    label: 'min guesses',
    formatter: intFormatter,
  },
  {
    id: 'avg_guesses',
    numeric: true,
    disablePadding: false,
    label: 'avg guesses',
    formatter: floatFormatter2,
  },
  // {
  //   id: 'avg_guesses_correct',
  //   numeric: true,
  //   disablePadding: false,
  //   label: 'avg guesses (correct)',
  //   formatter: floatFormatter2,
  // },
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
    formatter: (row, val) => `${val} / ${row.possible}`,
  },
  {
    id: 'wins',
    numeric: true,
    disablePadding: false,
    label: 'wins',
    formatter: intFormatter,
  },
  // {
  //   id: 'possible',
  //   numeric: true,
  //   disablePadding: false,
  //   label: 'possible',
  //   formatter: intFormatter,
  // },
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

function leagueFormatter(row: EnumeratedPuzzle, d: string) {
  return <Link to={`/wwm/leagues/${row.league_slug}`}>{d}</Link>;
}

function answerFormatter(row: EnumeratedPuzzle, a: string) {
  if (row.correct_answer === null) return '';

  return <p style={{ color: row.correct ? 'green' : 'red' }}>{row.correct_answer.toUpperCase()}</p>;
}

const ourheadCells: dt.HeadCell<EnumeratedPuzzle>[] = [
  {
    id: 'league_name',
    numeric: false,
    disablePadding: false,
    label: 'League',
    formatter: leagueFormatter,
  },
  {
    id: 'active_after',
    numeric: true,
    disablePadding: false,
    label: 'Active after',
    formatter: dateFormatter,
  },
  {
    id: 'active_before',
    numeric: true,
    disablePadding: false,
    label: 'Active until',
    formatter: dateFormatter,
  },
  {
    id: 'num_guesses',
    numeric: true,
    disablePadding: false,
    label: '# guesses',
  },
  {
    id: 'correct_answer',
    numeric: false,
    disablePadding: false,
    label: 'Your solution',
    formatter: answerFormatter,
  },
  {
    id: 'num_comments',
    numeric: true,
    disablePadding: false,
    label: 'Comments',
    // formatter: answerFormatter,
  },
];

export function WWMLeagueSeries({ league, seriesCallback }: { league: League; seriesCallback: any }) {
  const [series, setSeries] = useState<LeagueSeries[]>(null);
  const [active, setActive] = useState<LeagueSeries>(null);

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
      setActive(data[0]);
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
    return <div>Loading</div>;
  }

  async function navStats(row: LeagueSeries): Promise<void> {
    seriesCallback(row);
    setActive(row);
  }

  function buttonCallback(row: LeagueSeries, a: LeagueSeries): dt.ButtonInfo<LeagueSeries> {
    return {
      label: 'Show',
      callback: navStats,
      activeCallback: () => a && a.wordle_league_series_id !== row.wordle_league_series_id,
    };
  }

  return (
    <TitleBox title="League Series">
      <dt.DataTable
        rows={series}
        headCells={seriesHeadCells}
        mainColumn="start_date"
        initialSortColumn="start_date"
        initialSortOrder="desc"
        rowButtons={[row => buttonCallback(row, active)]}
        initialRowsPerPage={10}
        minWidth="10rem"
        selectedRows={[active && active.start_date]}
        storageKey="league-series"
      />
    </TitleBox>
  );
}

export function WWMLeagueSeriesStats({ league, series }: { league: League; series: LeagueSeries }) {
  const [stats, setStats] = useState<LeagueStats[]>(null);
  const [user] = useGetAndSet<User>('user');

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
    return (
      <TitleBox title="">
        <h2>No stats available yet</h2>
      </TitleBox>
    );
  }

  const d1 = formatDistance(new Date(series.start_date), new Date());
  const d2 = formatDistance(new Date(series.end_date), new Date());

  return (
    <TitleBox title={`Series Stats - ${d1} to ${d2}`}>
      <dt.DataTable
        rows={stats}
        headCells={statsHeadCells}
        mainColumn="username"
        initialSortColumn="score"
        initialSortOrder="desc"
        rowButtons={[]}
        initialRowsPerPage={25}
        selectedRows={[user && user.username]}
        storageKey="league-series-stats"
      />
    </TitleBox>
  );
}

export function WWMLeagueInfo({ league }: { league: League }) {
  const inviteLink = `/wwm/leagues/${league.league_slug}/join${league.is_private ? `/${league.invite_code}` : ''}`;

  return (
    <TitleBox title={league.league_name}>
      <table style={style.table}>
        <tbody>
          <tr>
            <td style={style.tdHead}>Created</td>
            <td style={style.tdData}>{formatDistance(new Date(league.create_date), new Date())}</td>
            <td style={style.tdHead}>Series Length</td>
            <td style={style.tdData}>{league.series_days} days</td>
          </tr>
          <tr>
            <td style={style.tdHead}>Letters</td>
            <td style={style.tdData}>{league.letters}</td>
            <td style={style.tdHead}>Max Guesses</td>
            <td style={style.tdData}>{league.max_guesses}</td>
          </tr>
          <tr>
            <td style={style.tdHead}>Puzzle Lifetime</td>
            <td style={style.tdData}>{league.time_to_live_hours} hours</td>
            <td style={style.tdHead}>Hard Mode</td>
            <td style={style.tdData}>{league.is_hard_mode ? 'yes' : 'no'}</td>
          </tr>
          <tr>
            <td style={style.tdData} colSpan={2}>
              League is: {league.is_private ? 'private' : 'public'}
              {league.is_private ? (
                <span>
                  &nbsp; (<a href={inviteLink}>Invite Link</a>)
                </span>
              ) : null}
            </td>
            <td style={style.tdData} colSpan={2}>
              You are {league.is_member ? '' : 'not'} a member
              {league.is_member ? null : (
                <span>
                  &nbsp; (<Link to={inviteLink}>Join Now</Link>)
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </TitleBox>
  );
}

export function LeaguePuzzles({ league, active }: { league: League; active: boolean }) {
  const [puzzles, setPuzzles] = useState<EnumeratedPuzzle[]>();
  const navigate = useNavigate();
  const [user]: [{ username: string }, any] = useGetAndSet('user');

  useEffect(() => {
    (async () => {
      setPuzzles((await getPuzzles(active, league.league_slug)).map((x, i) => ({ ...x, count: i })));
    })();
  }, [user]);

  async function navrow(row: EnumeratedPuzzle, postfix: string) {
    navigate(`/wwm/puzzles/${row.league_slug}/${row.wordle_answer_id}/${postfix}`);
  }

  async function navPlay(row: EnumeratedPuzzle): Promise<void> {
    return navrow(row, 'play');
  }

  async function navBrowse(row: EnumeratedPuzzle): Promise<void> {
    return navrow(row, 'browse');
  }

  function buttonCallback(row: EnumeratedPuzzle): dt.ButtonInfo<EnumeratedPuzzle> {
    if (row.completed) {
      return { label: 'Browse', callback: navBrowse, activeCallback: () => true };
    }
    if (!active && new Date(row.active_before) < new Date()) {
      return { label: 'Browse', callback: navBrowse, activeCallback: () => true };
    }
    return { label: 'Play', callback: navPlay, activeCallback: () => !!user };
  }

  if (!puzzles) {
    return <div>Loading...</div>;
  }

  return (
    <TitleBox title={active ? 'Active Puzzles' : 'Archived Puzzles'}>
      <dt.DataTable
        rows={puzzles}
        headCells={ourheadCells}
        mainColumn="count"
        initialSortColumn={active ? 'active_after' : 'active_before'}
        initialSortOrder={active ? 'asc' : 'desc'}
        initialRowsPerPage={5}
        rowButtons={[buttonCallback]}
        storageKey="league-puzzles"
      />
    </TitleBox>
  );
}

export function LeagueView() {
  const { leagueSlug } = useParams();
  const [league, setLeague] = useState<League>(null);
  const [series, setSeries] = useState<LeagueSeries>(null);
  const [user] = useGetAndSet('user');

  useEffect(() => {
    (async () => {
      setLeague(await getLeague(leagueSlug));
    })();
  }, [leagueSlug, user]);

  if (!league) {
    return <div>Loading</div>;
  }

  return (
    <div>
      <table width="100%">
        <tbody>
          <tr>
            <td valign="top" style={{ maxWidth: '25rem', width: '33%' }}>
              <WWMLeagueInfo league={league} />
              <WWMLeagueSeries league={league} seriesCallback={setSeries} />
            </td>
            <td valign="top">
              <WWMLeagueSeriesStats league={league} series={series} />
              <LeaguePuzzles league={league} active />
              <LeaguePuzzles league={league} active={false} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
