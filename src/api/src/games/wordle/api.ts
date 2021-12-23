import express, { Request, Response, NextFunction } from 'express';

import * as utils from './utils';
import { getParams } from '../../utils';
import * as exceptions from '../../exceptions';
import * as users from '../../users';
import * as queries from './queries';
import { League } from '../../../../ui/types/wordle';

export const router = express.Router();

const leagues = async (request: Request, response: Response, next: NextFunction) => {
  const { sort = 'league_name' } = getParams(request);
  const lg = await queries.leagues({ sort, user_id: response.locals.user ? response.locals.user.user_id : null, isMemberOnly: false });
  // console.log('lg', lg);
  const cols: (keyof League)[] = [
    'league_slug',
    'league_name',
    'letters',
    'series_days',
    'create_date',
    'start_date',
    'time_to_live_hours',
    'is_member',
  ];
  response.status(200).json(lg.map(l => Object.fromEntries(cols.map(c => [c, l[c]]))));
};

const joinLeagues = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { league_slugs } = getParams(request);

  return response.status(200).json({ details: 'ok' });
};

const check = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { guess, league_slug } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const abDate = new Date();
  const answers = await queries.answers({ league_slug, active_between: abDate, sort: 'active_after' });
  if (!answers.length) {
    return next(new exceptions.HttpNotFound('Wordle not found'));
  }

  if (!guess) {
    return next(new exceptions.HttpBadRequest('must pass field named "guess" containing guessed word'));
  }
  if (guess.length !== league.letters) {
    return next(new exceptions.HttpBadRequest(`guess must be ${league.letters} letters`));
  }

  const result = utils.evaluateGuess(answers[0].answer, guess);
  queries.addGuess({
    user_id: response.locals.user.user_id,
    wordle_answer_id: answers[0].wordle_answer_id,
    guess,
    correct_placement: result.reduce((c, n) => (c + n === '+' ? 1 : 0), 0),
    correct_letters: result.reduce((c, n) => (c + n === ' ' ? 0 : 1), 0),
    correct: guess === answers[0].answer,
  });

  const guesses = await queries.guesses({
    wordle_answer_id: answers[0].wordle_answer_id,
    sort: 'create_date',
  });

  return response.status(200).json(
    guesses.map((g: any) => ({
      guess: g.guess,
      result: utils.evaluateGuess(answers[0].answer, g),
    })),
  );
};

router.all('/check', check);
router.all('/leagues', leagues);
router.all('/join_leagues', joinLeagues);
