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
    'max_guesses',
    'series_days',
    'create_date',
    'start_date',
    'time_to_live_hours',
    'is_member',
  ];
  response.status(200).json(lg.map(l => Object.fromEntries(cols.map(c => [c, l[c]]))));
};

const joinLeague = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { league_slug } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  await queries.addLeagueMember({ user_id: response.locals.user.user_id, wordle_league_id: league.wordle_league_id });

  return response.status(200).json({ details: 'ok' });
};

const leaveLeague = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { league_slug } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  await queries.removeLeagueMember({ user_id: response.locals.user.user_id, wordle_league_id: league.wordle_league_id });

  return response.status(200).json({ details: 'ok' });
};

const check = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { guess, league_slug, wordle_answer_id } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const abDate = new Date();
  const answer = await queries.answer({ league_slug, wordle_answer_id, active_between: abDate });
  if (!answer) {
    return next(new exceptions.HttpNotFound('Wordle not found'));
  }

  if (!guess) {
    return next(new exceptions.HttpBadRequest('must pass field named "guess" containing guessed word'));
  }
  if (guess.length !== league.letters) {
    return next(new exceptions.HttpBadRequest(`guess must be ${league.letters} letters`));
  }

  const result = utils.evaluateGuess(answer.answer, guess);
  queries.addGuess({
    user_id: response.locals.user.user_id,
    wordle_answer_id: answer.wordle_answer_id,
    guess,
    correct_placement: result.reduce((c, n) => (c + n === '+' ? 1 : 0), 0),
    correct_letters: result.reduce((c, n) => (c + n === ' ' ? 0 : 1), 0),
    correct: guess === answer.answer,
  });

  const guesses = await queries.guesses({
    wordle_answer_id: answer.wordle_answer_id,
    sort: 'wordle_guesses.create_date',
  });

  return response.status(200).json(
    guesses.map((g: any) => ({
      guess: g.guess,
      result: utils.evaluateGuess(answer.answer, g.guess),
    })),
  );
};

const guesses = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { league_slug, wordle_answer_id } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const answer = await queries.answer({ league_slug, wordle_answer_id });
  if (!answer) {
    return next(new exceptions.HttpNotFound('Wordle not found'));
  }

  const guesses = await queries.guesses({
    wordle_answer_id: answer.wordle_answer_id,
    sort: 'wordle_guesses.create_date',
  });
  console.log('guesses', guesses);
  return response.status(200).json(
    guesses.map((g: any) => ({
      guess: g.guess,
      result: utils.evaluateGuess(answer.answer, g.guess),
    })),
  );
};

const activePuzzles = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const {} = getParams(request);

  const puzzles = await queries.active_puzzles({ user_id: response.locals.user.user_id });
  return response.status(200).json(puzzles);
};

router.all('/check', check);
router.all('/guesses', guesses);
router.all('/leagues', leagues);
router.all('/join_league', joinLeague);
router.all('/leave_league', leaveLeague);
router.all('/active_puzzles', activePuzzles);
