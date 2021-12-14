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

    divContainer: {},

    pContainer: {},
  };
  x.pressBlank = { ...x.button, ['background-color']: '#eee' };
  x.press = { ...x.button, ['background-color']: '#66F' };
  x.pressError = { ...x.button, ['background-color']: '#F66' };

  x.selectBlank = { ...x.outterButton, ['background-color']: '#eee' };
  x.select = { ...x.outterButton, ['background-color']: '#3A9' };

  return x;
};

const Wordle = ({ classes }: { classes: { [id: string]: any } }) => {
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
  const [inputs, setInputs] = React.useState({});
  const [layoutName, setLayoutName] = React.useState('default');
  const [inputName, setInputName] = React.useState('default');
  const keyboard = React.useRef(null);

  const onChangeAll = (inputs: any) => {
    /**
     * Here we spread the inputs into a new object
     * If we modify the same object, react will not trigger a re-render
     */
    setInputs({ ...inputs });
    console.log('Inputs changed', inputs);
  };

  const onKeyPress = (button: any) => {
    console.log('Button pressed', button);
  };

  const onChangeInput = (event: any) => {
    const inputVal = event.target.value;

    setInputs({
      ...inputs,
      [inputName]: inputVal,
    });

    keyboard.current.setInput(inputVal);
  };

  const getInputValue = (inputName: string) => {
    console.log(inputName);
    // return inputs[inputName] || '';
  };

  return (
    <div style={{ height: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 500, padding: 20 }}>
        <table style={{ margin: '0 auto', padding: 20 }}>
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
        <div style={{ width: 500 }}>
          <Keyboard
            layout={{
              default: ['q w e r t y u i o p {bksp}', 'a s d f g h j k l', 'z x c v b n m'],
            }}
            keyboardRef={r => (keyboard.current = r)}
            inputName={inputName}
            layoutName={layoutName}
            onChangeAll={onChangeAll}
            onKeyPress={onKeyPress}
          />
        </div>
      </div>
    </div>
  );
};

export default withStyles(style)(Wordle);
