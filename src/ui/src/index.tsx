import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { withStore, useGetAndSet } from 'react-context-hook';

import { withStyles } from '@material-ui/core/styles';
import * as material from '@material-ui/core';
// import { withRouter } from 'react-router'

import { Wordle } from './components/Worldle';
import { Login } from './components/Login';

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

const NavBarX = ({ classes, history }: any) => {
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');
  const [loginWidget, setLoginWidget] = useGetAndSet('login-widget');

  async function updateUser() {
    /*
    const fw = store.get('frameworks');
    if (fw === null || fw === undefined) return;

    const data = await fw.UserApi.user();
    if (data.status === 403) {
      store.set('user', null);
    } else {
      store.set('user', data);
    }
     */
  }

  function closeDrawer() {
    setLoginOpen(false);
  }

  function openDrawer() {
    setLoginOpen(true);
  }

  function logout() {
    localStorage.setItem('api-key', null);
    setUser(null);
    history.push('/');
  }

  React.useEffect(() => {
    setLoginWidget(this);
    updateUser();
  });

  return (
    <div className={classes.root}>
      <material.AppBar position="static">
        <material.Toolbar>
          {user ? (
            <div>
              <material.Typography>
                ({user.username})
                <material.Button color="inherit" onClick={logout}>
                  Logout
                </material.Button>
              </material.Typography>
            </div>
          ) : (
            <material.Button color="inherit" onClick={openDrawer}>
              Login / Sign up
            </material.Button>
          )}
        </material.Toolbar>
      </material.AppBar>
      <material.Drawer anchor="right" open={loginOpen} onClose={closeDrawer}>
        <div role="presentation">
          <Login />
        </div>
      </material.Drawer>
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
