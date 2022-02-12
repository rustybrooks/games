import { useEffect, useState } from 'react';
import { useGetAndSet } from 'react-context-hook';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { Box } from '../widgets/Box';
import * as dt from '../widgets/DataTable';
import { ActivePuzzle } from '../../../types';
import { getPuzzles } from './Leagues';
import { TitleBox } from '../widgets/TitleBox';
import { genLeagues } from '../../routes';
import { formatDistance } from '../../utils';

type EnumeratedPuzzle = ActivePuzzle & { count: number };

function dateFormatter(row: EnumeratedPuzzle, d: string) {
  return formatDistance(new Date(d), new Date());
}

function answerFormatter(row: EnumeratedPuzzle, a: string) {
  if (row.correct_answer === null) return '';

  return <span style={{ color: row.correct ? 'green' : 'red', fontSize: '0.8rem' }}>{row.correct_answer.toUpperCase()}</span>;
}

function leagueFormatter(row: EnumeratedPuzzle, d: string) {
  return <Link to={`/wwm/leagues/${row.league_slug}`}>{d}</Link>;
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

export function ActivePuzzles({ active = true }: { active?: boolean }) {
  const [puzzles, setPuzzles] = useState<EnumeratedPuzzle[]>([]);
  const [user]: [{ username: string }, any] = useGetAndSet('user');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (user) {
        setPuzzles((await getPuzzles(active)).map((x, i) => ({ ...x, count: i })));
      }
    })();
  }, [active, user]);

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
    return { label: 'Play', callback: navPlay, activeCallback: () => active };
  }

  if (!user) {
    return (
      <TitleBox title="No Words with Melvins puzzles available" width="40rem" style={{ margin: 'auto', marginTop: '5rem' }}>
        <Box>
          It looks like you're not logged in, so there aren't any puzzles for you to play. Log in using the menu at the top right, make sure{' '}
          <Link to={genLeagues()}>you are in some leagues</Link>, and try again.
        </Box>
      </TitleBox>
    );
  }

  return (
    <dt.DataTable
      rows={puzzles}
      headCells={ourheadCells}
      mainColumn="count"
      initialSortColumn={active ? 'active_after' : 'active_before'}
      initialSortOrder={active ? 'asc' : 'desc'}
      secondarySortColumn={active ? 'active_after' : 'active_before'}
      secondarySortOrder={active ? 'asc' : 'desc'}
      initialRowsPerPage={10}
      rowButtons={[buttonCallback]}
      storageKey={`datatable-${active ? 'active' : 'inactive'}-puzzles`}
    />
  );
}

export function ArchivedPuzzles() {
  return ActivePuzzles({ active: false });
}
