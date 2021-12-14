import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { withStore, useGetAndSet } from 'react-context-hook';

// import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
// import { withRouter } from 'react-router'

import Wordle from './components/Worldle';

const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 0,
    paddingLeft: 0,
  },

  tabLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 0,
    paddingLeft: 0,
  },
};

const NavBarX = ({ classes }: any) => {
  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Tabs value={0}>
          <Tab key="Home" label="home" className={classes.tabLink} />
        </Tabs>
      </AppBar>
    </div>
  );
};

const initialValue = {
  midiCallbackMap: {},
  midiInputs: {},
};

const NavBar = withStore(withStyles(styles)(NavBarX), initialValue);

ReactDOM.render(
  <BrowserRouter>
    <NavBar />
    <Routes>
      <Route path="/" element={<Wordle />} />
    </Routes>
  </BrowserRouter>,
  document.getElementById('root'),
);
