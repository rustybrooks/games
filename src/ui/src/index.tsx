import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { useGetAndSet, withStore } from 'react-context-hook';
import { css } from '@emotion/react';

import * as material from '@mui/material';

import * as constants from './constants';
import { Login } from './components/Login';
import { WordleGames } from './components/WordleGames';
import { WordleLeagues } from './components/WordleLeagues';
import { Wordle } from './components/Wordle';
import { WordleBrowse } from './components/Wordle';
import { Home } from './components/Home';

const styles = {
  root: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 0,
    paddingLeft: 0,
  }),

  tabLink: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 0,
    paddingLeft: 0,
  }),
};

const genUrl = (fn = '') => `${constants.BASE_URL}/api/user/${fn}`;

const NavBar = ({ history }: { history: any }) => {
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
    <div css={styles.root}>
      <material.AppBar position="static" css={{ flexGrow: 1 }}>
        <material.Toolbar>
          <div css={{ flexGrow: 1 }}>
            <material.Button color="inherit" component={Link} to="/">
              Home
            </material.Button>
            <material.Button color="inherit" component={Link} to="/wordle">
              Wordle Puzzles
            </material.Button>
            <material.Button color="inherit" component={Link} to="/wordle/leagues">
              Wordle Leagues
            </material.Button>
          </div>
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
  leagues: [],
  'active-puzzles': [],
};

/*
const storeConfig = {
listener: (state: any, key: string, prevValue: any, nextValue: any) => {
  console.log(`the key "${key}" changed in the store`);
  console.log('the old value is', prevValue);
  console.log('the current value is', nextValue);
  console.log('the state is', state);
},
logging: process.env.NODE_ENV !== 'production',
};
*/

function AppX({ history }: { history: any }) {
  return (
    <BrowserRouter>
      <NavBar history={history} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wordle" element={<WordleGames />} />
        <Route path="/wordle/leagues" element={<WordleLeagues />} />
        <Route path="/wordle/:leagueSlug/:answerId" element={<Wordle />} />
        <Route path="/wordle/:leagueSlug/:answerId/browse" element={<WordleBrowse />} />
      </Routes>
    </BrowserRouter>
  );
}
const App = withStore(AppX, initialValue);

ReactDOM.render(<App />, document.getElementById('root'));
