import { useCallback, useEffect, useRef, useState } from 'react';
import './Puzzle.css';
import { useNavigate } from 'react-router';

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

import { useGetAndSet } from 'react-context-hook';
import { Button, Link, Modal, Typography } from '@mui/material';

import { useParams } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import { League, ActivePuzzle } from '../../../types';
import * as constants from '../../constants';

import { getPuzzles } from './Leagues';

import { Cell, Div } from '../Styled';
import { ModalBox } from '../ModalBox';
import { genActivePuzzles, genJoinLeagueAndPlay, genLeague, genPlayNext, genPuzzleBrowse, genPuzzlePlay } from '../../routes';
import { TitleBox } from '../widgets/TitleBox';
import { Comments } from './Comments';

async function getLeague(leagueSlug: string, callback: any) {
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
    callback(data);
  }
}

function guessesToCategories(results: any) {
  const rightKeys: string[] = [];
  const wrongKeys = [];
  const sortaKeys = [];
  for (const r of results) {
    if (!r.guess.length) continue;
    for (const i in r.result) {
      if (r.result[i] === '+') {
        rightKeys.push(r.guess[i]);
      } else if (r.result[i] === '-') {
        sortaKeys.push(r.guess[i]);
      } else {
        wrongKeys.push(r.guess[i]);
      }
    }
  }

  const sortaKeys2 = sortaKeys.filter(k => !rightKeys.includes(k));

  return {
    sorta: sortaKeys2,
    right: rightKeys,
    wrong: wrongKeys,
  };
}

const style: { [id: string]: any } = {
  cell: {
    width: { mobile: '7rem', tablet: '8rem', desktop: '4.2rem' },
    height: { mobile: '7rem', tablet: '8rem', desktop: '4.2rem' },
    background: 'white',
    padding: '5px',
    border: '2px solid #ccc',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontWeight: 'bold',
  },

  table: {
    padding: '0px',
    borderSpacing: '6px',
    borderCollapse: 'separate',
  },

  container: {
    width: { mobile: '100%', tablet: '100%', desktop: '40rem' },
    margin: '0 auto',
    marginTop: { mobile: '20px', tablet: '20px', desktop: '20px' },
  },

  keyboard: {
    width: '100%',
    height: { mobile: '500px', tablet: '100%', desktop: '30rem' },
    textAlign: 'center',
  },
};

const colors = {
  wrong: '#787c7e',
  right: '#6aaa64',
  sorta: '#c9b458',
};

style.wrongCell = { backgroundColor: colors.wrong };
style.rightCell = { backgroundColor: colors.right };
style.sortaCell = { backgroundColor: colors.sorta };

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wwm/${fn}`;

function WWMDisplay({
  league,
  puzzle,
  results,
  onKeyPress = null,
  error = null,
  answer = null,
  showKeyboard = true,
  onTouchStart = null,
  onTouchMove = null,
  onTouchEnd = null,
}: {
  league: League;
  puzzle?: ActivePuzzle;
  results: { guess: string; result: string[]; reduction: number[] }[];
  onKeyPress?: (button: string) => Promise<void>;
  error?: string;
  answer?: string;
  // eslint-disable-next-line
  showKeyboard?: boolean;
  onTouchStart?: any;
  onTouchMove?: any;
  onTouchEnd?: any;
}) {
  const { sorta, right, wrong } = guessesToCategories(results);

  const buttonTheme = [];
  if (wrong.length) {
    buttonTheme.push({
      class: 'hg-wrong',
      buttons: wrong.join(' '),
    });
  }
  if (sorta.length) {
    buttonTheme.push({
      class: 'hg-sorta',
      buttons: sorta.join(' '),
    });
  }
  if (right.length) {
    buttonTheme.push({
      class: 'hg-right',
      buttons: right.join(' '),
    });
  }

  return (
    <Div
      sx={{
        width: '100%',
        height: '100%',
      }}
    >
      <Div sx={style.container} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div style={{ margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            League: {league.league_name} {league.is_hard_mode ? '- hard mode' : ''}
            {puzzle ? `(active until ${formatDistance(new Date(puzzle.active_before), new Date(), { addSuffix: true })})` : ''}
          </div>
        </div>
        <table css={style.table} style={{ margin: '0 auto' }}>
          <tbody>
            {[...Array(league.max_guesses).keys()].map(y => {
              const result = results[y] || { guess: '', result: [], reduction: [-1, -1] };
              return (
                <tr key={y}>
                  {[...Array(league.letters).keys()].map(x => {
                    const g = result.guess[x] || '';
                    const r = result.result[x];
                    let cn = 'cell';
                    if (r) {
                      switch (r) {
                        case '+':
                          cn = 'rightCell';
                          break;
                        case '-':
                          cn = 'sortaCell';
                          break;
                        case ' ':
                          cn = 'wrongCell';
                          break;
                        default:
                          cn = 'cell';
                      }
                    }
                    return (
                      <Cell key={x} sx={{ ...style.cell, ...style[cn] }}>
                        <Typography variant="h1">{g.toUpperCase()}</Typography>
                      </Cell>
                    );
                  })}
                  {result.reduction[0] !== -1 ? (
                    <td>
                      <Typography>{result.reduction[0]} left</Typography>
                    </td>
                  ) : null}
                </tr>
              );
            })}
            <tr>
              <td colSpan={league.letters}>
                {error ? (
                  <Typography variant="h2" color="#d22">
                    {error}
                    &nbsp;
                  </Typography>
                ) : (
                  <Typography variant="h2" color="#2d2">
                    {answer}
                    &nbsp;
                  </Typography>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        {showKeyboard ? (
          <Div sx={style.keyboard}>
            <Keyboard
              display={{
                '{enter}': 'enter',
                '{bksp}': 'bksp',
              }}
              layout={{
                default: ['q w e r t y u i o p', 'a s d f g h j k l', '{enter} z x c v b n m {bksp}'],
              }}
              buttonTheme={buttonTheme}
              layoutName="default"
              theme="hg-theme-default hg-layout-default myTheme"
              onKeyPress={onKeyPress}
            />
          </Div>
        ) : null}
      </Div>
    </Div>
  );
}

export function Puzzle({ answerId, leagueSlug, puzzle = null }: { answerId: string; leagueSlug: string; puzzle?: ActivePuzzle }) {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [status, setStatus] = useState({ answer: '', complete: false });
  const [user, setUser] = useGetAndSet('user');
  const [league, setLeague] = useState<League>(null);
  const [results, setResults] = useState<{ guess: string; result: string[]; reduction: number[] }[]>([]);
  const gridIdx = useRef(0);
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  useEffect(() => {
    getLeague(leagueSlug, setLeague);
  }, [leagueSlug, user]);

  const sendGuess = useCallback(
    async (word: string) => {
      const r = await fetch(genUrl('puzzles/check'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': localStorage.getItem('api-key'),
        },
        body: JSON.stringify({
          guess: word,
          wordle_answer_id: answerId,
          league_slug: leagueSlug,
        }),
      });
      if (r.status === 200) {
        const data = await r.json();
        gridIdx.current = data.guesses.length;
        while (data.guesses.length < league.max_guesses) {
          data.guesses.push({ guess: '', result: [], reduction: [-1, -1] });
        }
        if (data.correct) {
          setStatus({ answer: 'Correct answer!', complete: true });
          setOpen(true);
        } else if (data.answer) {
          setStatus({ answer: `Answer was: ${data.answer.toUpperCase()}`, complete: true });
          setOpen(true);
        } else {
          setError('');
        }

        setResults(data.guesses);
      } else {
        const data = await r.json();
        setError(data.details);
      }
    },
    [answerId, league?.max_guesses, leagueSlug],
  );

  const getGuesses = useCallback(async () => {
    const r = await fetch(genUrl('puzzles/guesses'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        wordle_answer_id: answerId,
        league_slug: leagueSlug,
        reduce: false,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();

      gridIdx.current = data.guesses.length;
      while (data.guesses.length < league.max_guesses) {
        data.guesses.push({ guess: '', result: [], reduction: [-1, -1] });
      }

      if (data.correct) {
        setStatus({ answer: 'Correct answer!', complete: true });
        setOpen(true);
      } else if (data.answer) {
        setStatus({ answer: `Answer was: ${data.answer.toUpperCase()}`, complete: true });
        setOpen(true);
      } else {
        setError('');
      }

      setResults(data.guesses);
    } else {
      const data = await r.json();
      setError(data.details);
    }
  }, [answerId, league?.max_guesses, leagueSlug]);

  const onKeyPress = useCallback(
    async (button: string) => {
      const buttonx = button.toLowerCase();

      // console.log('onkey', status);
      if (status.complete) {
        // console.log('puzzle complete', buttonx);

        if (buttonx === 'enter') {
          navigate(genPuzzleBrowse(leagueSlug, answerId));
          setOpen(false);
        }

        return;
      }

      const res = results[gridIdx.current];
      let word = res.guess;

      if (buttonx === '{bksp}' || buttonx === 'backspace') {
        const newResults = [...results];
        newResults[gridIdx.current].guess = word.slice(0, word.length - 1);
        setError('');
        setResults(newResults);
      } else if (buttonx === '{enter}' || buttonx === 'enter') {
        sendGuess(word);
      } else if (word.length < league.letters && buttonx.length === 1) {
        const myre = /[a-z]/;
        if (myre.test(buttonx)) {
          word += buttonx;
          const newResults = [...results];
          newResults[gridIdx.current].guess = word;
          setError('');
          setResults(newResults);
        }
      }
    },
    [answerId, league?.letters, leagueSlug, navigate, results, sendGuess],
  );

  const handleKeyDown = useCallback(
    (event: any) => {
      onKeyPress(event.key);
    },
    [onKeyPress],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, false);

    // cleanup this component
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (league) getGuesses();
  }, [getGuesses, league]);

  if (!results.length || (!results.length && error.length)) {
    return (
      <div css={{ textAlign: 'center', padding: '10px' }}>
        <Typography variant="h3" color={error.length ? 'red' : 'black'}>
          {error || 'Loading...'}
        </Typography>
      </div>
    );
  }

  return (
    <div>
      <WWMDisplay league={league} puzzle={puzzle} results={results} onKeyPress={onKeyPress} error={error} answer={status.answer} />
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <ModalBox width="30rem">
          <Typography id="modal-modal-title" variant="h6" component="h2" color={error && error.length ? 'red' : 'green'}>
            {error && error.length ? error : status.answer}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            You have completed this puzzle
          </Typography>

          <Div sx={{ textAlign: 'right' }}>
            <Button sx={{ margin: '.5rem' }} onClick={() => setOpen(false)} variant="outlined">
              Close
            </Button>
            <Button sx={{ margin: '.5rem' }} onClick={() => navigate(genPlayNext())} variant="outlined">
              Play Another
            </Button>
            <Button sx={{ margin: '.5rem' }} onClick={() => navigate(genPuzzleBrowse(leagueSlug, answerId))} variant="contained">
              See other solutions
            </Button>
          </Div>
        </ModalBox>
      </Modal>
    </div>
  );
}

export function WWMPuzzle() {
  const { answerId, leagueSlug } = useParams();
  return <Puzzle answerId={answerId} leagueSlug={leagueSlug} />;
}

export function WWMPlay() {
  const [user, setUser] = useGetAndSet('user');
  const [puzzle, setPuzzle] = useState<ActivePuzzle>();
  const [loaded, setLoaded] = useState(false);

  const nextPuzzle = useCallback(() => {
    if (user) {
      (async () => {
        const puzzles = await getPuzzles(true, null, false, 1);
        if (puzzles.length) {
          setPuzzle(puzzles[0]);
        }
        setLoaded(true);
      })();
    }
  }, [user]);

  useEffect(nextPuzzle, [nextPuzzle]);

  if (!puzzle) {
    if (loaded) {
      return (
        <TitleBox title="No available puzzles" width="40rem" style={{ margin: 'auto', marginTop: '5rem' }}>
          No more puzzle available for you at this time. Join more leagues, or come back later for new puzzles.
        </TitleBox>
      );
    }
    return <div>Loading...</div>;
  }

  return <Puzzle answerId={`${puzzle.wordle_answer_id}`} leagueSlug={puzzle.league_slug} puzzle={puzzle} />;
}

export function WWMBrowse() {
  const { answerId, leagueSlug, username } = useParams();
  const navigate = useNavigate();

  const [results, setResults] = useState<{ guess: string; result: string[]; reduction: number[] }[]>([]);
  const [completed, setCompleted] = useState([]);
  const [browseUser, setBrowseUser] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useGetAndSet('user');
  const [league, setLeague] = useState<League>();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    getLeague(leagueSlug, setLeague);
  }, [leagueSlug, user]);

  const swipeUser = useCallback(
    (amt: number) => {
      const idx = completed.findIndex(c => c.username === browseUser.username);

      const newidx = (((idx + amt) % completed.length) + completed.length) % completed.length;
      const newUser = completed[newidx];
      navigate(genPuzzleBrowse(leagueSlug, answerId, newUser.username));
      setBrowseUser(newUser);
    },
    [answerId, browseUser?.username, completed, leagueSlug],
  );

  const handleTouchStart = useCallback((e: any) => {
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: any) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStart - touchEnd > 150) {
      console.log('asswipe');
      swipeUser(1);
    }

    if (touchStart - touchEnd < -150) {
      swipeUser(-1);
    }
  }, [swipeUser, touchEnd, touchStart]);

  async function getCompletedUsers() {
    const r = await fetch(genUrl('puzzles/completed'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        wordle_answer_id: answerId,
        league_slug: leagueSlug,
      }),
    });

    if (r.status === 200) {
      const data = await r.json();
      setCompleted(data);
      if (data.length) {
        let found;
        if (username) {
          found = data.find((d: any) => d.username === username);
        }
        found = found || data[0];

        setBrowseUser(found);
      }
    } else {
      const data = await r.json();
      setError(data.detail_code);
    }
  }

  async function getGuesses(userId: number) {
    const r = await fetch(genUrl('puzzles/guesses'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        wordle_answer_id: answerId,
        user_id: userId,
        league_slug: leagueSlug,
        reduce: true,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();

      while (data.guesses.length < league.max_guesses) {
        data.guesses.push({ guess: '', result: [], reduction: [-1, -1] });
      }

      setResults(data.guesses);
    }
  }

  function handleKeyDown(event: any) {
    const key = event.key.toLowerCase();
    if (key === 'arrowright') {
      swipeUser(1);
    } else if (key === 'arrowleft') {
      swipeUser(-1);
    }
  }

  useEffect(() => {
    if (league) {
      getCompletedUsers();
    }
  }, [answerId, league, user]);

  useEffect(() => {
    (async () => {
      if (browseUser) {
        getGuesses(browseUser.user_id);
      }
    })();
  }, [browseUser]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, false);

    // cleanup this component
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [results]);

  if (!league) {
    return <div>Loading</div>;
  }

  if (error) {
    return (
      /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
      <div
        onKeyPress={event => {
          return event.key.toLowerCase() === 'enter' ? navigate(genPuzzlePlay(leagueSlug, answerId)) : null;
        }}
      >
        <TitleBox title={`${league.league_name}`} width="40rem" style={{ margin: 'auto', marginTop: '5rem' }}>
          {error === 'not_completed' ? (
            <Div>
              <Typography>
                You haven't completed this puzzle, so until you do, you can't see other people's results. If you'd like to play the puzle
                now, click the Play button.
              </Typography>
              <Div sx={{ textAlign: 'right' }}>
                <Button variant="contained" onClick={() => navigate(genPuzzlePlay(leagueSlug, answerId))}>
                  Play
                </Button>
              </Div>
            </Div>
          ) : null}
          {error === 'not_found' ? (
            <Div>
              <Typography>Wasn't able to find a Words with Melvins puzzle matching this url. Not sure what went wrong!</Typography>
              <br />
              <Typography>
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                Maybe <Link href={genActivePuzzles()}>look at the active puzzles</Link> and see what's there, or look at{' '}
                <Link href={genLeague(leagueSlug)}>the league page</Link> for this leage?
              </Typography>
            </Div>
          ) : null}
          {error === 'not_in_league' ? (
            <Div>
              <Typography>You can not view the results of this puzzle because you are not a member of the league it's in.</Typography>
              <Div sx={{ textAlign: 'right' }}>
                <Button variant="contained" onClick={() => navigate(genJoinLeagueAndPlay(leagueSlug, answerId))}>
                  Join League and Play
                </Button>
              </Div>
            </Div>
          ) : null}
          {error === 'unauthorized' ? (
            <Div>
              <Typography>
                You can not view the results of this puzzle because you are not logged into the site. Use the Login button at the top right
                to log in.
              </Typography>
            </Div>
          ) : null}
        </TitleBox>
      </div>
    );
  }

  if (!completed.length) {
    return (
      <div css={{ textAlign: 'center', padding: '10px' }}>
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  }

  return (
    <div>
      <div css={{ textAlign: 'center', padding: '10px' }}>
        {completed.map(c => (
          <Button
            key={c.username}
            sx={{ marginRight: '4px', marginBottom: '2px' }}
            color={c.correct ? 'success' : 'error'}
            variant={c.username === browseUser?.username ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              setBrowseUser(c);
              navigate(genPuzzleBrowse(leagueSlug, answerId, c.username));
            }}
          >
            {c.username} - {c.num_guesses}
          </Button>
        ))}
      </div>
      {browseUser ? (
        <div>
          <div css={{ textAlign: 'center' }}>
            <Typography variant="h3">{browseUser.username}</Typography>
          </div>
          <WWMDisplay
            league={league}
            results={results}
            showKeyboard={false}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          />
          <Comments wordle_answer_id={answerId} league={league} />
        </div>
      ) : null}
    </div>
  );
}
