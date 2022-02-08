import { useCallback, useEffect } from 'react';

import { useGetAndSet } from 'react-context-hook';

import * as constants from '../constants';
import { Login } from '.';
import { Drawer } from './widgets/Drawer';
import './AppBar.css';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/user/${fn}`;

export function AppBar() {
  const [loginOpen, setLoginOpen] = useGetAndSet('login-open', false);
  const [loginWidget, setLoginWidget] = useGetAndSet('login-widget');
  const [user, setUser]: [{ username: string }, any] = useGetAndSet('user');

  const openDrawer = useCallback(() => {
    setLoginOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setLoginOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.setItem('api-key', null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async () => {
    const data = await fetch(genUrl(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': localStorage.getItem('api-key'),
      },
    });
    if (data.status === 403) {
      setUser(null);
    } else {
      setUser(await data.json());
    }
  }, []);

  useEffect(() => {
    setLoginWidget(this);
    updateUser();
  }, []);

  /*
  return (
    <div style={styles.root}>
      <div style={{ flexGrow: 1 }}>
        <div style={{ flexGrow: 1 }}>
          <Button color="blue" to="/wwm">
            Play
          </Button>
          <Button color="blue" to="">
            Active
          </Button>
          <Button color="blue" to="/wwm/archived">
            Archived
          </Button>
          <Button color="blue" to="/wwm/leagues">
            Leagues
          </Button>
          <Button color="blue" to="/wwm/bots">
            Bots
          </Button>
        </div>
        {user ? (
          <div>
            ({user.username})<Button color="blue">Logout</Button>
          </div>
        ) : (
          <Button color="blue" onClick={openDrawer}>
            Login / Sign up
          </Button>
        )}
      </div>
    </div>
  );
 */

  return (
    <div>
      <header className="appbar-header">
        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', flexGrow: 2 }}>
            <div className="appbar-menu">
              <a className="appbar-button" tabIndex={0} href="/wwm">
                Play
              </a>
            </div>
            <div className="appbar-menu">
              <a className="appbar-button" tabIndex={0} href="/wwm/active">
                Active
              </a>
            </div>
            <div className="appbar-menu">
              <a className="appbar-button" tabIndex={0} href="/wwm/archived">
                Archive
              </a>
            </div>
            <div className="appbar-menu">
              <a className="appbar-button" tabIndex={0} href="/wwm/leagues">
                Leagues
              </a>
            </div>
            <div className="appbar-menu">
              <a className="appbar-button" tabIndex={0} href="/wwm/bots">
                Bots
              </a>
            </div>
          </div>
          <div className="appbar-login">
            {user ? (
              <div>
                ({user.username})
                <button className="appbar-login" tabIndex={0} type="button">
                  Logout
                </button>
              </div>
            ) : (
              <button className="appbar-login" tabIndex={0} type="button" onClick={openDrawer}>
                Login / Sign up
              </button>
            )}
          </div>
        </div>
      </header>
      <Drawer anchor="right" open={loginOpen} onClose={closeDrawer} style={{ minWidth: '400px', maxWidth: '600px' }}>
        <div role="presentation">
          <Login updateUser={updateUser} />
        </div>
      </Drawer>
    </div>
  );
}
