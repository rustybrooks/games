import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { withStore, useGetAndSet } from 'react-context-hook';

import { withStyles } from '@material-ui/core/styles';
import * as material from '@material-ui/core';

import * as constants from './constants';

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

const genUrl = (fn = '') => `${constants.BASE_URL}/user/${fn}`;

const NavBarX = ({ classes, history }: any) => {
  const [loginOpen, setLoginOpen] = useGetAndSet('login-open', false);
  const [loginWidget, setLoginWidget] = useGetAndSet('login-widget');
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');

  console.log('loginopen!', loginOpen);

  function openDrawer() {
    setLoginOpen(true);
  }

  function closeDrawer() {
    setLoginOpen(false);
  }

  function logout() {
    localStorage.setItem('api-key', null);
    setUser(null);
    history.push('/');
  }

  async function updateUser() {
    const data = await fetch(genUrl(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
    });
    console.log('updateUser', data);
    if (data.status === 403) {
      setUser(null);
    } else {
      setUser(await data.json());
    }
  }

  React.useEffect(() => {
    setLoginWidget(this);
    updateUser();
  }, []);

  console.log('user =', user);
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
      <material.Drawer anchor="left" open={loginOpen} onClose={closeDrawer}>
        <div role="presentation">
          <Login updateUser={updateUser} />
        </div>
      </material.Drawer>
    </div>
  );
};

const initialValue: { [id: string]: any } = {
  'login-widget': null,
  'login-open': false,
  user: null,
};

const storeConfig = {
  listener: (state: any, key: string, prevValue: any, nextValue: any) => {
    console.log(`the key "${key}" changed in the store`);
    console.log('the old value is', prevValue);
    console.log('the current value is', nextValue);
    console.log('the state is', state);
  },
  logging: process.env.NODE_ENV !== 'production',
};

const NavBar = withStore(withStyles(styles)(NavBarX), initialValue, storeConfig);

ReactDOM.render(
  <BrowserRouter>
    <NavBar />
    <Routes>
      <Route path="/" element={<Wordle />} />
    </Routes>
  </BrowserRouter>,
  document.getElementById('root'),
);
