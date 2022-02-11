import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as constants from '../../constants';
import { User, UserStats } from '../../../types';
import { TitleBox } from '../widgets/TitleBox';
import * as dt from '../widgets/DataTable';
import './User.css';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

const ourheadCells: dt.HeadCell<UserStats>[] = [
  {
    id: 'league_name',
    numeric: false,
    disablePadding: false,
    label: 'League',
  },
];

async function getUserStats(username: string): Promise<UserStats[]> {
  const r = await fetch(genUrl('users'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': localStorage.getItem('api-key'),
    },
    body: JSON.stringify({
      username,
    }),
  });
  if (r.status === 200) {
    return r.json();
  }
  return null;
}

export function UserLeagues({ userStats, selected, selectCallback }: { userStats: UserStats[]; selected: number; selectCallback: any }) {
  async function navStats(row: UserStats): Promise<void> {
    selectCallback(row);
  }

  function buttonCallback(row: UserStats): dt.ButtonInfo<UserStats> {
    return {
      label: 'Show',
      callback: navStats,
      activeCallback: () => true,
    };
  }

  return (
    <TitleBox title="Leagues">
      {' '}
      <dt.DataTable
        rows={userStats}
        headCells={ourheadCells}
        storageKey="user-stats-leagues"
        mainColumn="wordle_league_id"
        initialSortColumn="league_name"
        initialSortOrder="asc"
        rowButtons={[row => buttonCallback(row)]}
        selectedRows={[selected]}
      />
    </TitleBox>
  );
}

export function UserLeagueStats({ userStats }: { userStats: UserStats }) {
  if (!userStats) {
    return <div>Loading</div>;
  }

  const buckets: { [id: number]: number } = {};
  let max = 0;
  for (let i = 0; i < userStats.buckets.length; i += 1) {
    buckets[userStats.buckets[i]] = userStats.counts[i];
    max = Math.max(max, userStats.counts[i]);
  }

  return (
    <TitleBox title={`Stats for ${userStats.league_name}`}>
      <div style={{ display: 'flex' }}>
        <div className="stat-box">
          <div className="stat-number">{userStats.completed}</div>
          <div className="stat-title">Played</div>
        </div>

        <div className="stat-box">
          <div className="stat-number">{Math.round(userStats.correct)}</div>
          <div className="stat-title">Wins</div>
        </div>

        <div className="stat-box">
          <div className="stat-number">{Math.round(userStats.pct_correct)}</div>
          <div className="stat-title">Win %</div>
        </div>
      </div>
      <div style={{ maxWidth: '30rem' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
          const num = buckets[n] || 0;
          return (
            <div style={{ display: 'flex' }} key={n}>
              <div className="hist-both">{n}</div>
              <div
                className="hist-both hist-bar"
                style={{ minWidth: '.75em', width: `${(100 * num) / max}%`, background: buckets[n] ? '#6aaa64' : '#787c7e' }}
              >
                {num}
              </div>
            </div>
          );
        })}
      </div>
    </TitleBox>
  );
}

export function User() {
  // const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');
  const { username } = useParams();
  const [userStats, setUserStats] = useState<UserStats[]>();
  const [league, setLeague] = useState<number>();

  useEffect(() => {
    (async () => {
      if (username) {
        const stats = await getUserStats(username);
        console.log(stats);
        setUserStats(stats);
        setLeague(stats[0].wordle_league_id);
      }
    })();
  }, [username]);

  if (!userStats) {
    return <div>Loading</div>;
  }

  return (
    <div>
      <table width="100%">
        <tbody>
          <tr>
            <td valign="top" style={{ maxWidth: '300px', width: '33%' }}>
              <UserLeagues userStats={userStats} selected={league} selectCallback={(row: UserStats) => setLeague(row.wordle_league_id)} />
            </td>
            <td valign="top">
              <UserLeagueStats userStats={userStats.find(u => u.wordle_league_id === league)} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
