import express, { Request, Response, NextFunction } from 'express';

import { randomBytes } from 'crypto';
import * as utils from './utils';
import { getParams } from '../../utils';
import * as exceptions from '../../exceptions';
import * as users from '../../users';
import * as queries from './queries';
import { League } from '../../../../ui/types';

export const router = express.Router();

const leagues = async (request: Request, response: Response, next: NextFunction) => {
  const { sort = 'league_name' } = getParams(request);
  const lg = await queries.getLeagues({ sort, user_id: response.locals.user ? response.locals.user.user_id : null, isMemberOnly: false });
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
  const { league_slug, invite_code } = getParams(request);

  const league = await queries.getLeague({ league_slug });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  if (league.is_private && invite_code !== league.invite_code) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  await queries.addLeagueMember({ user_id: response.locals.user.user_id, wordle_league_id: league.wordle_league_id });

  return response.status(200).json(league);
};

const leaveLeague = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { league_slug } = getParams(request);

  const league = await queries.getLeague({ league_slug, user_id: response.locals.user.user_id });
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

  const league = await queries.getLeague({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    const league2 = await queries.getLeague({ league_slug });
    if (league2) {
      return next(new exceptions.HttpBadRequest('You are not in this league', 'not_in_league'));
    }
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const abDate = new Date();
  const answer = await queries.answer({ league_slug, wordle_answer_id, active_between: abDate });
  if (!answer) {
    return next(new exceptions.HttpNotFound('Puzzle not found'));
  }

  if (!guess) {
    return next(new exceptions.HttpBadRequest('must pass field named "guess" containing guessed word'));
  }
  if (guess.length !== league.letters) {
    return next(new exceptions.HttpBadRequest(`guess must be ${league.letters} letters`));
  }

  const guessesList = await queries.getGuesses({
    user_id: response.locals.user.user_id,
    wordle_answer_id: answer.wordle_answer_id,
    sort: 'wordle_guesses.create_date',
  });
  if (guessesList.find(g => g.correct)) {
    return next(new exceptions.HttpBadRequest('Already have a correct answer'));
  }

  if (guessesList.find(g => g.guess === guess)) {
    return next(new exceptions.HttpBadRequest('Already made this guess'));
  }

  const guesses = guessesList.map(g => g.guess);

  if (guesses.length >= league.max_guesses) {
    return next(new exceptions.HttpBadRequest('Already reached maximum number of quesses for this puzzle'));
  }

  if (!utils.isWordInList(guess, league.accept_word_list || utils.defaultAnswerWordList)) {
    return next(new exceptions.HttpBadRequest('Invalid word'));
  }

  guesses.push(guess);
  const result = utils.evaluateGuess(answer.answer, guess);

  console.log('is hard mode??', league.is_hard_mode);
  if (league.is_hard_mode) {
    if (!utils.checkHardMode(league, guess, result, guessesList, answer)) {
      return next(new exceptions.HttpBadRequest('Invalid guess - violates prior rules'));
    }
  }

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
      reduction: [-1, -1],
    })),
    correct: guess === answer.answer,
    completed: guess === answer.answer || guesses.length === league.max_guesses,
    answer: guesses.length === league.max_guesses ? answer.answer : null,
  });
};

const guesses = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { user_id, league_slug, wordle_answer_id, reduce } = getParams(request);

  const league = await queries.getLeague({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    const league2 = await queries.getLeague({ league_slug });
    if (league2) {
      return next(new exceptions.HttpBadRequest('You are not in this league', 'not_in_league'));
    }
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const answer = await queries.answer({ league_slug, wordle_answer_id });
  if (!answer) {
    return next(new exceptions.HttpNotFound('Puzzle not found'));
  }

  if (user_id) {
    const ourStatus = await queries.wordleStatuses({ wordle_answer_id, completed: true, user_id: response.locals.user.user_id });
    if (!ourStatus.length) {
      return next(new exceptions.HttpBadRequest('You have not completed this puzzle', 'not_completed'));
    }
  }

  const effectiveUserId = user_id || response.locals.user.user_id;

  const these_guesses = await queries.getGuesses({
    user_id: effectiveUserId,
    wordle_answer_id: answer.wordle_answer_id,
    sort: 'wordle_guesses.create_date',
  });

  const correct = !!these_guesses.find(g => g.correct);
  let words1: string[] = [];
  // const words2: string[] = [];
  if (reduce) {
    words1 = utils.wordList(league.letters, league.accept_word_list || utils.defaultAnswerWordList);
    // words2 = utils.wordList(league.letters, league.source_word_list || utils.defaultSourceWordList);
  }

  return response.status(200).json({
    guesses: these_guesses.map((g: any) => {
      const result = utils.evaluateGuess(answer.answer, g.guess);
      if (reduce) {
        words1 = utils.eliminateGuess(words1, g.guess, result.join(''));
        // words2 = utils.eliminateGuess(words2, g.guess, result.join(''));
      }
      return {
        guess: g.guess,
        result,
        correct: g.correct,
        reduction: reduce ? [words1.length, -1] : [-1, -1],
      };
    }),
    correct,
    answer: these_guesses.length === league.max_guesses ? answer.answer : null,
  });
};

const puzzles = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }

  const { league_slug, active, sort } = getParams(request);
  if (league_slug) {
    const league = await queries.getLeague({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
    if (!league) {
      const league2 = await queries.getLeague({ league_slug });
      if (league2) {
        return next(new exceptions.HttpBadRequest('You are not in this league', 'not_in_league'));
      }
      return next(new exceptions.HttpNotFound('League not found'));
    }
  }

  const p = await queries.getPuzzles({ user_id: response.locals.user.user_id, sort: sort || 'active_after', active, league_slug });
  return response.status(200).json(p);
};

const completedUsers = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }
  const { league_slug, wordle_answer_id } = getParams(request);

  const league = await queries.getLeague({ league_slug, user_id: response.locals.user.user_id, isMemberOnly: true });
  if (!league) {
    const league2 = await queries.getLeague({ league_slug });
    if (league2) {
      return next(new exceptions.HttpBadRequest('You are not in this league', 'not_in_league'));
    }
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const answer = await queries.answer({ league_slug, wordle_answer_id });
  if (!answer) {
    return next(new exceptions.HttpNotFound('Puzzle not found'));
  }

  const ourStatus = await queries.wordleStatuses({ wordle_answer_id, user_id: response.locals.user.user_id, completed: true });
  if (!ourStatus.length) {
    return next(new exceptions.HttpBadRequest('You have not completed this puzzle', 'not_completed'));
  }

  const data = await queries.wordleStatuses({
    wordle_answer_id,
    completed: true,
    sort: ['correct::char(5) desc', 'num_guesses', 'ws.end_date'],
  });
  return response.status(200).json(data);
};

const leagueInfo = async (request: Request, response: Response, next: NextFunction) => {
  const { league_slug } = getParams(request);

  const league = await queries.getLeague({ league_slug, user_id: response.locals.user ? response.locals.user.user_id : null });
  if (!league) {
    const league2 = await queries.getLeague({ league_slug });
    if (league2) {
      return next(new exceptions.HttpBadRequest('You are not in this league', 'not_in_league'));
    }
    return next(new exceptions.HttpNotFound('League not found'));
  }

  return response.status(200).json(league);
};

const leagueSeries = async (request: Request, response: Response, next: NextFunction) => {
  const { league_slug } = getParams(request);

  const league = await queries.getLeague({ league_slug, user_id: response.locals.user ? response.locals.user.user_id : null });
  if (!league) {
    const league2 = await queries.getLeague({ league_slug });
    if (league2) {
      return next(new exceptions.HttpBadRequest('You are not in this league', 'not_in_league'));
    }
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const series = await queries.getleagueSeries({
    wordle_league_id: league.wordle_league_id,
    start_date_before: new Date(),
    sort: '-start_date',
  });
  return response.status(200).json(series);
};

const leagueSeriesStats = async (request: Request, response: Response, next: NextFunction) => {
  const { league_slug, wordle_league_series_id } = getParams(request);

  const league = await queries.getLeague({ league_slug, user_id: response.locals.user ? response.locals.user.user_id : null });
  if (!league) {
    const league2 = await queries.getLeague({ league_slug });
    if (league2) {
      return next(new exceptions.HttpBadRequest('You are not in this league', 'not_in_league'));
    }
    return next(new exceptions.HttpNotFound('League not found'));
  }

  const stats = await queries.getLeagueSeriesStats({ league_slug, wordle_league_series_id, sort: '-score' });
  return response.status(200).json(stats);
};

const leagueNameCheck = async (request: Request, response: Response, next: NextFunction) => {
  const { league_name } = getParams(request);

  const league_slug = utils.nameToSlug(league_name);

  const league = await queries.getLeague({ league_slug });
  if (league) {
    return next(new exceptions.HttpBadRequest('A league with this slug already exists', 'league_name_exists'));
  }

  return response.status(200).json({ status: 'ok', league_slug });
};

const addLeague = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }

  const { league_name, series_days, answer_interval_minutes, letters, max_guesses, time_to_live_hours, is_private, is_hard_mode } =
    getParams(request);

  const invite_code = is_private ? randomBytes(16).toString('hex') : null;
  const league_slug = utils.nameToSlug(league_name);

  const start_date = new Date();
  while (start_date.getUTCDay() !== 0) {
    start_date.setDate(start_date.getDate() - 1);
  }
  start_date.setMilliseconds(0);
  start_date.setSeconds(0);
  start_date.setHours(0);

  const data = {
    league_name,
    league_slug,
    series_days,
    answer_interval_minutes,
    letters,
    max_guesses,
    time_to_live_hours,
    start_date,
    create_date: new Date(),
    is_private,
    is_hard_mode,
    invite_code,
    accept_word_list: utils.defaultAnswerWordList,
    source_word_list: utils.defaultSourceWordList,
    create_user_id: response.locals.user.user_id,
  };

  const l = await queries.addLeague(data);
  queries.addLeagueMember({
    user_id: response.locals.user.user_id,
    wordle_league_id: l.wordle_league_id,
  });

  return response.status(200).json({ status: 'ok', league_slug });
};

const comments = async (request: Request, response: Response, next: NextFunction) => {
  const { wordle_answer_id } = getParams(request);

  const league = await queries.getLeague({ wordle_answer_id, user_id: response.locals.user ? response.locals.user.user_id : null });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  return response.status(200).json(await queries.getComments({ wordle_answer_id, sort: 'create_date' }));
};

const addComment = async (request: Request, response: Response, next: NextFunction) => {
  try {
    users.requireLogin(response, next);
  } catch (e) {
    return next(e);
  }

  const { wordle_answer_id, comment } = getParams(request);

  const league = await queries.getLeague({ wordle_answer_id, user_id: response.locals.user ? response.locals.user.user_id : null });
  if (!league) {
    return next(new exceptions.HttpNotFound('League not found'));
  }

  await queries.addComment({
    wordle_answer_id,
    comment,
    user_id: response.locals.user.user_id,
  });

  await queries.sleep(50);

  return response.status(200).json({ status: 'ok' });
};

router.all('/puzzles/', puzzles);
router.all('/puzzles/check', check);
router.all('/puzzles/guesses', guesses);
router.all('/puzzles/completed', completedUsers);
router.all('/puzzles/comments', comments);
router.all('/puzzles/add_comment', addComment);

router.all('/leagues', leagues);
router.all('/leagues/check', leagueNameCheck);
router.all('/leagues/add', addLeague);
router.all('/leagues/join', joinLeague);
router.all('/leagues/leave', leaveLeague);
router.all('/leagues/info', leagueInfo);
router.all('/leagues/series', leagueSeries);
router.all('/leagues/series_stats', leagueSeriesStats);
