import { useEffect } from 'react';
import { useGetAndSet } from 'react-context-hook';
import { Paper, Typography, Link } from '@mui/material';
import { formatDistance } from 'date-fns';
import { useNavigate } from 'react-router';
import * as eht from '../EnhancedTable';
import { ActivePuzzle, League } from '../../../types';
import { getPuzzles, getLeagues } from './Leagues';
import { TitleBox } from '../TitleBox';
import { Div } from '../Styled';
import { genLeagues, genPuzzlePlay } from '../../routes';

type EnumeratedPuzzle = ActivePuzzle & { count: number };

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function dateFormatter(row: EnumeratedPuzzle, d: string) {
  return formatDistance(new Date(d), new Date(), { addSuffix: true });
}

function answerFormatter(row: EnumeratedPuzzle, a: string) {
  if (row.correct_answer === null) return '';

  return (
    <Typography variant="body2" color={row.correct ? 'green' : 'red'}>
      {row.correct_answer.toUpperCase()}
    </Typography>
  );
}

function leagueFormatter(row: EnumeratedPuzzle, d: string) {
  return <Link href={`/wwm/leagues/${row.league_slug}`}>{d}</Link>;
}

const ourheadCells: eht.HeadCell<EnumeratedPuzzle>[] = [
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

export function ActivePuzzles({ active = true }) {
  const [leagues, setLeagues] = useGetAndSet<League[]>('leagues');
  const [puzzles, setPuzzles] = useGetAndSet<EnumeratedPuzzle[]>('active-puzzles');
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!leagues.length) setLeagues(await getLeagues());
      if (user) {
        setPuzzles((await getPuzzles(active)).map((x, i) => ({ ...x, count: i })));
      }
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

  function buttonCallback(row: EnumeratedPuzzle): eht.ButtonInfo<EnumeratedPuzzle> {
    if (row.completed) {
      return { label: 'Browse', callback: navBrowse, activeCallback: () => true };
    }
    return { label: 'Play', callback: navPlay, activeCallback: () => active };
  }

  if (!user) {
    return (
      <TitleBox title="No Words with Melvins puzzles available" width="40rem" sx={{ margin: 'auto', marginTop: '5rem' }}>
        <Div>
          <Typography>
            It looks like you're not logged in, so there aren't any puzzles for you to play. Log in using the menu at the top right, make
            sure <Link href={genLeagues()}>you are in some leagues</Link>, and try again.
          </Typography>
        </Div>
      </TitleBox>
    );
  }

  return (
    <Paper sx={{ mb: 2 }}>
      <eht.EnhancedTable
        rows={puzzles}
        headCells={ourheadCells}
        mainColumn="count"
        initialSortColumn={active ? 'active_after' : 'active_before'}
        initialSortOrder={active ? 'asc' : 'desc'}
        initialRowsPerPage={10}
        rowButtons={[buttonCallback]}
      />
    </Paper>
  );
}

export function ArchivedPuzzles() {
  return ActivePuzzles({ active: false });
}
