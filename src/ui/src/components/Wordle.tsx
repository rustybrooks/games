import * as React from 'react';
import './Wordle.css';
import { useNavigate } from 'react-router';

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

import * as constants from '../constants';
import { ActivePuzzle, League } from '../../types/wordle';
import { useGetAndSet } from 'react-context-hook';
import { Button, Paper, Typography } from '@mui/material';

import { Link, useParams } from 'react-router-dom';

import { getLeagues } from './WordleLeagues';

let style: { [id: string]: any } = {
  cell: {
    width: '3rem',
    height: '3rem',
    background: 'white',
    padding: '5px',
    border: '2px solid #ccc',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    fontSize: '30px',
  },

  table: {
    padding: '20px',
    borderSpacing: '6px',
    borderCollapse: 'separate',
  },
};

style.wrongCell = { ...style.cell, backgroundColor: '#787c7e' };
style.rightCell = { ...style.cell, backgroundColor: '#6aaa64' };
style.sortaCell = { ...style.cell, backgroundColor: '#c9b458' };

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

function WordleDisplay({
  league,
  results,
  onKeyPress = null,
  error = null,
  answer = null,
  showKeyboard = true,
}: {
  league: League;
  results: { guess: string; result: string[] }[];
  onKeyPress?: (button: string) => Promise<void>;
  error?: string;
  answer?: string;
  showKeyboard?: boolean;
}) {
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
    <div style={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 500, padding: 20 }}>
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
                      <td key={x} css={style[cn]}>
                        {g.toUpperCase()}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <td colSpan={league.letters}>
                {error ? <Typography color="#d22">{error}&nbsp;</Typography> : <Typography color="#2d2">{answer}&nbsp;</Typography>}
              </td>
            </tr>
          </tbody>
        </table>
        {showKeyboard ? (
          <div style={{ width: 500 }}>
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
              onKeyPress={onKeyPress}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const Wordle = () => {
  const { answerId, leagueSlug } = useParams();
  console.log('RENDER WORDLE answerId', answerId, leagueSlug);
  // const puzzle = { league_name: 'foo', wordle_answer_id: answerId };

  const [leagues, setLeagues] = useGetAndSet<League[]>('leagues');
  const [results, setResults] = React.useState<{ guess: string; result: string[] }[]>([]);
  const [error, setError] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const navigate = useNavigate();

  const gridIdx = React.useRef(0);

  let league: League = null;
  if (leagues) {
    league = leagues.find(l => l.league_slug === leagueSlug);
  }

  async function sendGuess(word: string) {
    const r = await fetch(genUrl('check'), {
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
        setAnswer('Correct answer!');
        navigate(`/wordle/${league.league_slug}/${answerId}/browse`);
      } else if (data.answer) {
        setError(`Answer was: ${data.answer.toUpperCase()}`);
        navigate(`/wordle/${league.league_slug}/${answerId}/browse`);
      } else {
        if (error.length) {
          setError('');
        }
      }

      setResults(data.guesses);
    } else {
      const data = await r.json();
      console.log('received error', data);
      setError(data.detail);
    }
  }

  async function getGuesses() {
    const r = await fetch(genUrl('guesses'), {
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
        setAnswer('Correct answer!');
      } else if (data.answer) {
        setError(`Answer was: ${data.answer.toUpperCase()}`);
      } else {
        if (error.length) {
          setError('');
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
      if (error.length) {
        setError('');
      }
      setResults(newResults);
    } else if (buttonx === '{enter}' || buttonx === 'enter') {
      sendGuess(word);
    } else if (word.length < league.letters && button.length === 1) {
      const myre = /[a-z]/;
      if (myre.test(button)) {
        word += buttonx;
        let newResults = [...results];
        newResults[gridIdx.current].guess = word;
        if (error.length) {
          setError('');
        }
        setResults(newResults);
      }
    }
  };

  const handleKeyDown = (event: any) => {
    onKeyPress(event.key);
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, false);

    // cleanup this component
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [results]);

  React.useEffect(() => {
    if (!leagues || !leagues.length) {
      (async () => {
        setLeagues(await getLeagues());
      })();
    }
  }, [answerId]);

  React.useEffect(() => {
    if (league) getGuesses();
  }, [league]);

  if (!results.length) {
    return (
      <div>
        <Typography variant="h3">Loading...</Typography>
      </div>
    );
  }

  return <WordleDisplay league={league} results={results} onKeyPress={onKeyPress} error={error} answer={answer} />;
};

export const WordleBrowse = () => {
  const { answerId, leagueSlug } = useParams();

  const [leagues, setLeagues] = useGetAndSet<League[]>('leagues');
  const [results, setResults] = React.useState<{ guess: string; result: string[] }[]>([]);
  const [completed, setCompleted] = React.useState([]);
  const [user, setUser] = React.useState(null);
  const [error, setError] = React.useState(null);

  let league: League = null;
  if (leagues) {
    league = leagues.find(l => l.league_slug === leagueSlug);
  }

  async function getCompletedUsers() {
    const r = await fetch(genUrl('completed_users'), {
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
    const r = await fetch(genUrl('guesses'), {
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

  React.useEffect(() => {
    if (!leagues || !leagues.length) {
      (async () => {
        setLeagues(await getLeagues());
      })();
    }

    if (league) {
      getCompletedUsers();
    }
  }, [answerId, leagues]);

  React.useEffect(() => {
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
          <WordleDisplay league={league} results={results} showKeyboard={false} />
        </div>
      ) : null}
    </Paper>
  );
};
