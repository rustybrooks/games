import * as React from 'react';
import { useGetAndSet } from 'react-context-hook';
import * as eht from './EnhancedTable';
import { League } from '../../types/wordle';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import * as constants from '../constants';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

export const WordleGames = () => {
  return <Paper sx={{ width: '100%', mb: 2 }}></Paper>;
};
