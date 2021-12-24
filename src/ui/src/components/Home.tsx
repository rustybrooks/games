import * as React from 'react';
import * as constants from '../constants';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export const Home = () => {
  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Typography>
        There's not much here. Maybe you'd like to
        <ul>
          <li>
            <Link to="/wordle/leagues">Join some Wordle leagues</Link>
          </li>
          <li>
            <Link to="/wordle">Play new Wordle matches in your leagues</Link>
          </li>
        </ul>
      </Typography>
    </Paper>
  );
};
