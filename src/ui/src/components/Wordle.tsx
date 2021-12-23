import * as React from 'react';
import { withStyles } from '@material-ui/core/styles';

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

import * as constants from '../constants';

const style = () => {
  const x: any = {
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

  x.wrongCell = { ...x.cell, backgroundColor: '#787c7e' };
  x.rightCell = { ...x.cell, backgroundColor: '#6aaa64' };
  x.sortaCell = { ...x.cell, backgroundColor: '#c9b458' };

  return x;
};

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

const WordleX = ({ classes }: { classes: { [id: string]: any } }) => {
  const [results, setResults] = React.useState(['', '', '', '', '', '']);
  const [guesses, setGuesses] = React.useState(['', '', '', '', '', '']);
  const gridIdx = React.useRef(0);

  const onKeyPress = (button: string) => {
    const buttonx = button.toLowerCase();
    let word = guesses[gridIdx.current];

    if (buttonx === '{bksp}' || buttonx === 'backspace') {
      guesses[gridIdx.current] = word.slice(0, word.length - 1);
      setGuesses([...guesses]);
    } else if (buttonx === '{enter}' || buttonx === 'enter') {
      fetch(genUrl('check'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guess: word }),
      }).then(r => {
        if (r.status === 200) {
          r.json().then(x => {
            results.splice(gridIdx.current, 1, x);
            setResults([...results]);
            gridIdx.current += 1;
          });
        }
      });
    } else if (word.length < 5 && button.length === 1) {
      const myre = /[a-z]/;
      if (myre.test(button)) {
        word += buttonx;
        guesses.splice(gridIdx.current, 1, word);
        setGuesses([...guesses]);
      }
    }
  };

  const onKeyPress2 = (button: string) => {
    onKeyPress(button);
  };

  React.useEffect(() => {
    document.addEventListener('keydown', event => onKeyPress2(event.key), false);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 500, padding: 20 }}>
        <table className={classes.table} style={{ margin: '0 auto' }}>
          <tbody>
            {[0, 1, 2, 3, 4, 5].map(y => (
              <tr key={y}>
                {[0, 1, 2, 3, 4].map(x => {
                  const g = guesses[y][x] || '';
                  const r = results[y][x];
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
                    <td key={x} className={classes[cn]}>
                      {g.toUpperCase()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ width: 500 }}>
          <Keyboard
            display={{
              '{enter}': 'enter',
              '{bksp}': 'backspace',
            }}
            layout={{
              default: ['q w e r t y u i o p', 'a s d f g h j k l', '{enter} z x c v b n m {bksp}'],
            }}
            layoutName="default"
            onKeyPress={onKeyPress}
          />
        </div>
      </div>
    </div>
  );
};

export const Wordle = withStyles(style)(WordleX);
