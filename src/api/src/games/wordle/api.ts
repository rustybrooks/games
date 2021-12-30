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

  const guessesList = await queries.guesses({
    user_id: response.locals.user.user_id,
    wordle_answer_id: answer.wordle_answer_id,
    sort: 'wordle_guesses.create_date',
  });

  if (guessesList.find(g => g.correct)) {
    return next(new exceptions.HttpBadRequest(`Already have a correct answer`));
  }

  if (guessesList.find(g => g.guess === guess)) {
    return next(new exceptions.HttpBadRequest(`Already made this guess`));
  }

  const guesses = guessesList.map(g => g.guess);

  if (guesses.length >= league.max_guesses) {
    return next(new exceptions.HttpBadRequest(`Already reached maximum number of quesses for this puzzle`));
  }

  if (!utils.isWordInList(guess)) {
    return next(new exceptions.HttpBadRequest(`Invalid word`));
  }

  guesses.push(guess);

  const result = utils.evaluateGuess(answer.answer, guess);
  queries.addGuess({
    user_id: response.locals.user.user_id,
    wordle_answer_id: answer.wordle_answer_id,
    guess,
    correct_placement: result.reduce((c, n) => (c + n === '+' ? 1 : 0), 0),
    correct_letters: result.reduce((c, n) => (c + n === ' ' ? 0 : 1), 0),
    correct: guess === answer.answer,
    completed: guess === answer.answer || guesses.length >= league.max_guesses,
  });

  return response.status(200).json({
    guesses: guesses.map((g: string) => ({
      guess: g,
      result: utils.evaluateGuess(answer.answer, g),
    })),
    correct: guess === answer.answer,
    answer: guesses.length === league.max_guesses ? answer.answer : null,
  });
};

const guesses = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { user_id, league_slug, wordle_answer_id } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const answer = await queries.answer({ league_slug, wordle_answer_id });
  if (!answer) {
    return next(new exceptions.HttpNotFound('Wordle not found'));
  }

  if (user_id) {
    const ourStatus = await queries.wordleStatuses({ wordle_answer_id, completed: true, user_id: response.locals.user.user_id });
    if (!ourStatus.length) {
      return next(new exceptions.HttpBadRequest('You have not completed this Wordle'));
    }
  }

  let effectiveUserId = user_id || response.locals.user.user_id;

  const guesses = await queries.guesses({
    user_id: effectiveUserId,
    wordle_answer_id: answer.wordle_answer_id,
    sort: 'wordle_guesses.create_date',
  });

  const correct = !!guesses.find(g => g.correct);

  return response.status(200).json({
    guesses: guesses.map((g: any) => ({
      guess: g.guess,
      result: utils.evaluateGuess(answer.answer, g.guess),
      correct: g.correct,
    })),
    correct: correct,
    answer: guesses.length === league.max_guesses ? answer.answer : null,
  });
};

const activePuzzles = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }

  const puzzles = await queries.activePuzzles({ user_id: response.locals.user.user_id, sort: 'active_after' });
  return response.status(200).json(puzzles);
};

const completedUsers = async (request: Request, response: Response, next: NextFunction) => {
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

  const ourStatus = await queries.wordleStatuses({ wordle_answer_id, user_id: response.locals.user.user_id, completed: true });
  if (!ourStatus.length) {
    return next(new exceptions.HttpBadRequest('You have not completed this Wordle'));
  }

  const data = await queries.wordleStatuses({ wordle_answer_id, completed: true, sort: ['-correct_letters,num_guesses,ws.end_date'] });
  return response.status(200).json(data);
};

const leagueInfo = async (request: Request, response: Response, next: NextFunction) => {
  const { league_slug } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  return response.status(200).json(league);
};

const leagueSeries = async (request: Request, response: Response, next: NextFunction) => {
  const { league_slug } = getParams(request);

  const league = await queries.league({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }
};

router.all('/puzzles/check', check);
router.all('/puzzles/guesses', guesses);
router.all('/puzzles/active', activePuzzles);
router.all('/puzzlles/completed', completedUsers);

router.all('/leagues', leagues);
router.all('/leagues/join', joinLeague);
router.all('/leagues/leave', leaveLeague);
router.all('/leagues/info', leagueInfo);
router.all('/leagues/series', leagueSeries);
