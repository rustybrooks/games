import { useEffect } from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { useGetAndSet, withStore } from 'react-context-hook';
import { css } from '@emotion/react';

import { AppBar, Button, Drawer, Typography, Toolbar } from '@mui/material';
import * as constants from './constants';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Wordle, WordleLeague, WordleLeagues, WordleGames, WordleBrowse, Login, Home, Test } from './components';

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

  useEffect(() => {
    setLoginWidget(this);
    updateUser();
  }, []);

  console.log('user =', user);
  return (
    <div css={styles.root}>
      <AppBar position="static" css={{ flexGrow: 1 }}>
        <Toolbar>
          <div css={{ flexGrow: 1 }}>
            <Button color="inherit" component={Link} to="/">
              Home
            </Button>
            <Button color="inherit" component={Link} to="/wordle">
              Wordle Puzzles
            </Button>
            <Button color="inherit" component={Link} to="/wordle/leagues">
              Wordle Leagues
            </Button>
          </div>
          {user ? (
            <div>
              <Typography>
                ({user.username})
                <Button color="inherit" onClick={logout}>
                  Logout
                </Button>
              </Typography>
            </div>
          ) : (
            <Button color="inherit" onClick={openDrawer}>
              Login / Sign up
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Drawer anchor="right" open={loginOpen} onClose={closeDrawer}>
        <div role="presentation">
          <Login updateUser={updateUser} history={history} />
        </div>
      </Drawer>
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

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: false; // removes the `xs` breakpoint
    sm: false;
    md: false;
    lg: false;
    xl: false;
    mobile: true;
    tablet: true;
    desktop: true;
  }
}

const ff = ['Roboto', 'Arial', 'sans-serif'].join(',');

const theme = createTheme({
  breakpoints: {
    values: {
      mobile: 350,
      tablet: 1000,
      desktop: 1200,
    },
  },
});

theme.typography.body1 = {
  fontSize: '1rem',
  fontFamily: ff,
  fontColor: 'red',

  [theme.breakpoints.down('mobile')]: {
    fontSize: '1rem',
  },

  [theme.breakpoints.between('mobile', 'tablet')]: {
    fontSize: '1.8rem',
  },

  [theme.breakpoints.between('tablet', 'desktop')]: {
    fontSize: '1.0rem',
  },

  [theme.breakpoints.up('desktop')]: {
    fontSize: '1.0rem',
  },
};

theme.typography.button = theme.typography.body1;

theme.typography.body2 = {
  fontSize: '1rem',
  fontFamily: ff,
  fontColor: 'red',

  [theme.breakpoints.down('mobile')]: {
    fontSize: '.8rem',
  },

  [theme.breakpoints.between('mobile', 'tablet')]: {
    fontSize: '1.5rem',
  },

  [theme.breakpoints.between('tablet', 'desktop')]: {
    fontSize: '.8rem',
  },

  [theme.breakpoints.up('desktop')]: {
    fontSize: '.8rem',
  },
};

theme.typography.h1 = {
  fontSize: '1rem',
  fontFamily: ff,

  [theme.breakpoints.down('mobile')]: {
    fontSize: '2rem',
  },

  [theme.breakpoints.between('mobile', 'tablet')]: {
    fontSize: '3rem',
  },

  [theme.breakpoints.between('tablet', 'desktop')]: {
    fontSize: '4rem',
  },

  [theme.breakpoints.up('desktop')]: {
    fontSize: '1.8rem',
  },
};

theme.typography.h2 = {
  fontSize: '.9rem',
  fontFamily: ff,

  [theme.breakpoints.down('mobile')]: {
    fontSize: '1.8rem',
  },

  [theme.breakpoints.between('mobile', 'tablet')]: {
    fontSize: '2.6em',
  },

  [theme.breakpoints.between('tablet', 'desktop')]: {
    fontSize: '2rem',
  },

  [theme.breakpoints.up('desktop')]: {
    fontSize: '1.5em',
  },
};

function AppX({ history }: { history: any }) {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <NavBar history={history} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test" element={<Test />} />
          <Route path="/wordle" element={<WordleGames />} />
          <Route path="/wordle/leagues" element={<WordleLeagues />} />
          <Route path="/wordle/:leagueSlug/:answerId/play" element={<Wordle />} />
          <Route path="/wordle/:leagueSlug/:answerId/browse" element={<WordleBrowse />} />
          <Route path="/wordle/leagues/:leagueSlug:" element={<WordleLeague />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
const App = withStore(AppX, initialValue);

render(<App />, document.getElementById('root'));
