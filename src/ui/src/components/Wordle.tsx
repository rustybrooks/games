import { useState, useRef, useEffect } from 'react';
import './Wordle.css';

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

import * as constants from '../constants';
import { League } from '../../types/wordle';
import { useGetAndSet } from 'react-context-hook';
import { Box, Button, Modal, Paper, Typography, Link } from '@mui/material';

import { useParams } from 'react-router-dom';

import { getLeagues } from './WordleLeagues';

import { Cell, Div } from './Styled';

let style: { [id: string]: any } = {
  cell: {
    width: { mobile: '7rem', tablet: '8rem', desktop: '4rem' },
    height: { mobile: '7rem', tablet: '8rem', desktop: '4rem' },
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
    width: { mobile: '100%', tablet: '100%', desktop: '30rem' },
    margin: '0 auto',
    marginTop: { mobile: '20px', tablet: '20px', desktop: '20px' },
  },

  keyboard: {
    width: '100%',
    height: { mobile: '500px', tablet: '100%', desktop: '30rem' },
    textAlign: 'center',
  },

  modalBox: {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  },
};

style.wrongCell = { backgroundColor: '#787c7e' };
style.rightCell = { backgroundColor: '#6aaa64' };
style.sortaCell = { backgroundColor: '#c9b458' };

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

function WordleDisplay({
  league,
  answerId,
  results,
  onKeyPress = null,
  error = null,
  answer = null,
  showKeyboard = true,
  complete = false,
}: {
  league: League;
  answerId: string;
  results: { guess: string; result: string[] }[];
  onKeyPress?: (button: string) => Promise<void>;
  error?: string;
  answer?: string;
  showKeyboard?: boolean;
  complete?: boolean;
}) {
  console.log('render worddisplay', error, answer, complete);

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

  const buttonTheme = [];
  if (wrongKeys.length) {
    buttonTheme.push({
      class: 'hg-wrong',
      buttons: wrongKeys.join(' '),
    });
  }
  if (sortaKeys2.length) {
    buttonTheme.push({
      class: 'hg-sorta',
      buttons: sortaKeys2.join(' '),
    });
  }
  if (rightKeys.length) {
    buttonTheme.push({
      class: 'hg-right',
      buttons: rightKeys.join(' '),
    });
  }

  return (
    <Div
      sx={{
        width: '100%',
        height: '100%',
      }}
    >
      <Div sx={style.container}>
        <table css={style.table} style={{ margin: '0 auto' }}>
          <tbody>
            {[...Array(league.max_guesses).keys()].map(y => {
              const result = results[y] || { guess: '', result: [] };
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
                    // console.log(result, x, r, cn, style[cn]);
                    return (
                      <Cell key={x} sx={{ ...style.cell, ...style[cn] }}>
                        <Typography variant="h1">{g.toUpperCase()}</Typography>
                      </Cell>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <td colSpan={league.letters}>
                {error ? (
                  <Typography variant="h2" color="#d22">
                    {error}&nbsp;
                  </Typography>
                ) : (
                  <Typography variant="h2" color="#2d2">
                    {answer}&nbsp;
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
                '{bksp}': 'backspace',
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

export const Wordle = () => {
  const { answerId, leagueSlug } = useParams();

  const [status, setStatus] = useState({ answer: '', error: '', complete: false });
  const [leagues, setLeagues] = useGetAndSet<League[]>('leagues');
  const [results, setResults] = useState<{ guess: string; result: string[] }[]>([]);
  const gridIdx = useRef(0);
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  console.log('RENDER WORDLE answerId', answerId, leagueSlug, status);

  let league: League = null;
  if (leagues) {
    league = leagues.find(l => l.league_slug === leagueSlug);
  }

  async function sendGuess(word: string) {
    const r = await fetch(genUrl('puzzles/check'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        guess: word,
        wordle_answer_id: answerId,
        league_slug: league.league_slug,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();
      gridIdx.current = data.guesses.length;
      while (data.guesses.length < league.max_guesses) {
        data.guesses.push({ guess: '', result: [] });
      }
      if (data.correct) {
        setStatus({ ...status, answer: 'Correct answer!', complete: true });
        setOpen(true);
      } else if (data.answer) {
        setStatus({ ...status, error: `Answer was: ${data.answer.toUpperCase()}`, complete: true });
        setOpen(true);
      } else {
        if (status.error.length) {
          setStatus({ ...status, error: '' });
        }
      }

      setResults(data.guesses);
    } else {
      const data = await r.json();
      console.log('received error', data);
      setStatus({ ...status, error: data.detail });
    }
  }

  async function getGuesses() {
    const r = await fetch(genUrl('puzzles/guesses'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        wordle_answer_id: answerId,
        league_slug: league.league_slug,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();

      gridIdx.current = data.guesses.length;
      while (data.guesses.length < league.max_guesses) {
        data.guesses.push({ guess: '', result: [] });
      }

      if (data.correct) {
        setStatus({ ...status, answer: 'Correct answer!', complete: true });
        setOpen(true);
      } else if (data.answer) {
        setStatus({ ...status, error: `Answer was: ${data.answer.toUpperCase()}`, complete: true });
        setOpen(true);
      } else {
        if (status.error.length) {
          setStatus({ ...status, error: '' });
        }
      }

      setResults(data.guesses);
    }
  }

  const onKeyPress = async (button: string) => {
    const buttonx = button.toLowerCase();
    const res = results[gridIdx.current];
    let word = res.guess;

    if (buttonx === '{bksp}' || buttonx === 'backspace') {
      let newResults = [...results];
      newResults[gridIdx.current].guess = word.slice(0, word.length - 1);
      if (status.error.length) {
        setStatus({ ...status, error: '' });
      }
      setResults(newResults);
    } else if (buttonx === '{enter}' || buttonx === 'enter') {
      sendGuess(word);
    } else if (word.length < league.letters && buttonx.length === 1) {
      const myre = /[a-z]/;
      if (myre.test(buttonx)) {
        word += buttonx;
        let newResults = [...results];
        newResults[gridIdx.current].guess = word;
        if (status.error.length) {
          setStatus({ ...status, error: '' });
        }
        setResults(newResults);
      }
    }
  };

  const handleKeyDown = (event: any) => {
    onKeyPress(event.key);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, false);

    // cleanup this component
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [results]);

  useEffect(() => {
    if (!leagues || !leagues.length) {
      (async () => {
        setLeagues(await getLeagues());
      })();
    }
  }, [answerId]);

  useEffect(() => {
    if (league) getGuesses();
  }, [league]);

  if (!results.length) {
    return (
      <div>
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  }

  return (
    <div>
      <WordleDisplay
        league={league}
        answerId={answerId}
        results={results}
        onKeyPress={onKeyPress}
        error={status.error}
        answer={status.answer}
        complete={status.complete}
      />
      ,
      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <Box sx={style.modalBox}>
          <Typography id="modal-modal-title" variant="h6" component="h2" color={status.error && status.error.length ? 'red' : 'green'}>
            {status.error && status.error.length ? status.error : status.answer}
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            You have completed this puzzle.
            <Link href={`/wordle/puzzles/${league.league_slug}/${answerId}/browse`}>You can view other people's solutions here</Link>
          </Typography>

          <Div sx={{ textAlign: 'right' }}>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Div>
        </Box>
      </Modal>
    </div>
  );
};

export const WordleBrowse = () => {
  const { answerId, leagueSlug } = useParams();

  const [leagues, setLeagues] = useGetAndSet<League[]>('leagues');
  const [results, setResults] = useState<{ guess: string; result: string[] }[]>([]);
  const [completed, setCompleted] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  let league: League = null;
  if (leagues) {
    league = leagues.find(l => l.league_slug === leagueSlug);
  }

  async function getCompletedUsers() {
    const r = await fetch(genUrl('puzzles/completed'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
      body: JSON.stringify({
        wordle_answer_id: answerId,
        league_slug: league.league_slug,
      }),
    });

    if (r.status === 200) {
      const data = await r.json();
      setCompleted(data);
      if (data.length) {
        setUser(data[0]);
      }
    } else {
      const data = await r.json();
      setError(data.detail);
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
        league_slug: league.league_slug,
      }),
    });
    if (r.status === 200) {
      const data = await r.json();

      while (data.guesses.length < league.max_guesses) {
        data.guesses.push({ guess: '', result: [] });
      }

      setResults(data.guesses);
    }
  }

  useEffect(() => {
    if (!leagues || !leagues.length) {
      (async () => {
        setLeagues(await getLeagues());
      })();
    }

    if (league) {
      getCompletedUsers();
    }
  }, [answerId, leagues]);

  useEffect(() => {
    (async () => {
      if (user) {
        getGuesses(user.user_id);
      }
    })();
  }, [user]);

  if (!completed.length) {
    return (
      <div css={{ textAlign: 'center' }}>
        <Typography variant="h3" color={error ? 'red' : 'black'}>
          {error || 'Loading...'}
        </Typography>
      </div>
    );
  }

  return (
    <Paper sx={{ padding: '10px' }}>
      <div css={{ textAlign: 'center' }}>
        {completed.map(c => (
          <Button
            key={c.username}
            sx={{ marginRight: '4px' }}
            color={c.correct ? 'success' : 'error'}
            variant="outlined"
            size="small"
            onClick={event => {
              setUser(c);
            }}
          >
            {c.username} - {c.num_guesses}
          </Button>
        ))}
      </div>
      {user ? (
        <div>
          <div css={{ textAlign: 'center' }}>
            <Typography variant="h3">{user.username}</Typography>
          </div>
          <WordleDisplay league={league} answerId={answerId} results={results} showKeyboard={false} />
        </div>
      ) : null}
    </Paper>
  );
};
