import * as React from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

const style = () => {
  let x: any = {
    outterButton: {
      padding: 10,
      'align-items': 'center',
    },

    button: {
      padding: 5,
    },
  };
  x.pressBlank = { ...x.button, ['background-color']: '#eee' };
  x.press = { ...x.button, ['background-color']: '#66F' };
  x.pressError = { ...x.button, ['background-color']: '#F66' };

  x.selectBlank = { ...x.outterButton, ['background-color']: '#eee' };
  x.select = { ...x.outterButton, ['background-color']: '#3A9' };

  return x;
};

const Wordle = ({ classes }: { classes: { [id: string]: any } }) => {
  const onChange = (input: any) => {
    console.log('Input changed', input);
  };

  const onKeyPress = (button: any) => {
    console.log('Button pressed', button);
  };

  const init_grid = () => {
    let igrid = [];
    for (let y = 0; y < 9; y++) {
      let row = [];
      for (let y = 0; y < 9; y++) {
        row.push({ pressed: false, error: false, selected: false });
      }
      igrid.push(row);
    }
    return igrid;
  };

  let [grid, setGrid] = React.useState(() => init_grid());

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '90%',
      }}
    >
      <table>
        <tbody>
          {[0, 1, 2, 3, 4].map(y => {
            return (
              <tr key={y}>
                {[0, 1, 2, 3, 4].map(x => {
                  if (y === 0 && x === 8) {
                    return <td key={x}>&nbsp;</td>;
                  } else {
                    const g = grid[y][x];
                    const c1 = g.selected ? 'select' : 'selectBlank';
                    const c2 = g.pressed ? (g.error ? 'pressError' : 'press') : 'pressBlank';
                    return (
                      <td key={x} className={classes[c1]}>
                        <div className={classes[c2]}>
                          {y}, {x}
                        </div>
                      </td>
                    );
                  }
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Keyboard onChange={onChange} onKeyPress={onKeyPress} />
    </div>
  );
};

export default withStyles(style)(Wordle);
