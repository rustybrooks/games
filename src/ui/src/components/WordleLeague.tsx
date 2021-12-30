import * as React from 'react';

import * as constants from '../constants';
import { League } from '../../types/wordle';
import { useGetAndSet } from 'react-context-hook';
import { Box, Button, Modal, Paper, Typography, Link } from '@mui/material';

import { useParams } from 'react-router-dom';
import { Div } from './Styled';

const genUrl = (fn = '') => `${constants.BASE_URL}/api/games/wordle/${fn}`;

export function WordleLeague({}) {
  return <div>Loading</div>;
}
