import { Link } from 'react-router-dom';
import { Typography, Paper } from '@mui/material';

export const Home = () => (
  <Paper sx={{ width: '100%', mb: 2 }}>
    <div>
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
    </div>
  </Paper>
);
