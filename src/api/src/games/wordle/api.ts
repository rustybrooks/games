import express, { Request, Response, NextFunction } from 'express';
// import { getParams } from '../utils';
// import * as queries from './queries';
// import * as exceptions from '../exceptions';

export const router = express.Router();

const wordleCheck = (request: Request, response: Response) => {
  const expected = 'masse';

  let guess = '';

  if (request.body && request.body.guess) {
    guess = request.body.guess;
  } else if (request.query && request.query.guess) {
    guess = request.query.guess.toString();
  }

  if (!guess) {
    response.status(400).json({
      detail: 'must pass field named "guess" containing guessed word',
    });
    return;
  }
  if (guess.length !== 5) {
    response.status(400).json({
      detail: 'guess must be 5 letters',
    });
  }

  const expectedCounts = expected.split('').reduce((prev: { [id: string]: number }, current) => {
    const prev2 = { ...prev };
    prev2[current] = (prev2[current] || 0) + 1;
    return prev2;
  }, {});
  const guessCounts = guess.split('').reduce((prev: { [id: string]: number }, current, i) => {
    const prev2 = { ...prev };
    if (expected[i] === current) {
      prev2[current] = (prev2[current] || 0) + 1;
    }
    return prev2;
  }, {});
  const out = guess.split('').map((l, i) => {
    if (l !== expected[i]) {
      guessCounts[l] += 1;
    }
    if (l === expected[i]) {
      return '+';
    }
    if (expected.includes(l) && guessCounts[l] <= expectedCounts[l]) {
      return '-';
    }
    return ' ';
  });

  response.status(200).json(out.join(''));
};
