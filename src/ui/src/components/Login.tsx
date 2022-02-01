import { useCallback, useState } from 'react';

import { useGetAndSet } from 'react-context-hook';

import { FormGroup, Tabs, Tab, Box, FormControl, TextField, Button } from '@mui/material';
import * as constants from '../constants';

const style = {
  root: {
    maxWidth: 600,
    minWidth: 400,
    // float: 'left',
  },

  formControl: {
    margin: '10px',
    minWidth: 120,
  },

  button: {
    margin: '10px',
  },
};

const genUrl = (fn = '') => `${constants.BASE_URL}/api/user/${fn}`;

function LoginX({ updateUser }: { updateUser: any }) {
  const [tab, setTab] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [errors, setErrors]: [{ username?: string; email?: string; password?: string; password2?: string }, any] = useState({});

  const [loginOpen, setLoginOpen] = useGetAndSet('login-open');

  const handleTabChange = (event: any, newTab: any) => {
    setTab(newTab);
  };

  function closeDrawer() {
    setLoginOpen(false);
  }

  const doCancel = useCallback(() => {
    closeDrawer();
  }, []);

  const doLogin = useCallback(async () => {
    const result = await fetch(genUrl('login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    if (result.status === 403) {
      localStorage.setItem('api-key', null);
      setErrors({ ...errors, password: 'Error logging in' });
    } else {
      setErrors({});
      localStorage.setItem('api-key', await result.json());
      closeDrawer();
      updateUser();
    }
  }, [username, password]);

  const doSignup = async () => {
    const result = await fetch(genUrl('signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
        password2,
      }),
    });
    if (result.status === 400) {
      setErrors((await result.json()).details);
    } else {
      setErrors({});
      localStorage.setItem('api-key', await result.json());
      closeDrawer();
      updateUser();
    }
  };

  return (
    <div style={style.root}>
      <Tabs value={tab} onChange={handleTabChange}>
        <Tab label="Login" value="login" />
        <Tab label="Signup" value="signup" />
      </Tabs>

      <Box component="div" display={tab === 'signup' ? 'block' : 'none'}>
        <FormGroup>
          <FormControl style={style.formControl}>
            <TextField
              error={Boolean(errors.username)}
              helperText={errors.username}
              id="susername"
              label="Username"
              autoFocus
              onChange={event => setUsername(event.target.value)}
            />
          </FormControl>

          <FormControl style={style.formControl}>
            <TextField
              error={Boolean(errors.email)}
              helperText={errors.email}
              id="semail"
              label="Email"
              onChange={event => setEmail(event.target.value)}
            />
          </FormControl>

          <FormControl style={style.formControl}>
            <TextField
              error={Boolean(errors.password)}
              helperText={errors.password}
              id="spassword"
              label="Password"
              type="password"
              onChange={event => setPassword(event.target.value)}
            />
          </FormControl>

          <FormControl style={style.formControl}>
            <TextField
              error={Boolean(errors.password2)}
              helperText={errors.password2}
              id="spassword2"
              label="Confirm Password"
              type="password"
              onChange={event => setPassword2(event.target.value)}
            />
          </FormControl>
        </FormGroup>

        <Button style={style.button} onClick={doCancel} variant="contained">
          Cancel
        </Button>
        <Button style={style.button} onClick={doSignup} variant="contained" color="primary">
          Sign up
        </Button>
      </Box>

      <Box component="div" display={tab === 'login' ? 'block' : 'none'}>
        <FormGroup>
          <FormControl style={style.formControl}>
            <TextField
              error={Boolean(errors.username)}
              helperText={errors.username}
              id="username"
              label="Username"
              onChange={event => setUsername(event.target.value)}
              autoFocus
            />
          </FormControl>

          <FormControl style={style.formControl}>
            <TextField
              error={Boolean(errors.password)}
              helperText={errors.password}
              id="password"
              label="Password"
              type="password"
              onChange={event => setPassword(event.target.value)}
              onKeyPress={event => {
                event.key.toLowerCase() === 'enter' ? doLogin() : null;
              }}
            />
          </FormControl>
        </FormGroup>

        <Button style={style.button} onClick={doCancel} variant="contained">
          Cancel
        </Button>
        <Button style={style.button} onClick={doLogin} variant="contained" color="primary">
          Login
        </Button>
      </Box>
    </div>
  );
}

export const Login = LoginX;
