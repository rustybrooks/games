import { apiClass, apiConfig, HttpBadRequest, HttpNotFound } from '@rustybrooks/api-framework';
import * as utils from './utils';
import * as queries from './queries';
import { User } from '../../../../ui/types';
import { checkLeague } from './index';

@apiClass()
export class Puzzles {
  @apiConfig({ requireLogin: true })
  async index({
    league_slug,
    active,
    played,
    sort,
    limit = null,
    _user,
  }: {
    league_slug: string;
    active: boolean;
    played: boolean;
    sort: string | string[];
    limit?: number;
    _user: User;
  }) {
    await checkLeague(league_slug, _user, false, false);
    return queries.getPuzzles({ user_id: _user.user_id, sort: sort || 'active_after', active, league_slug, played });
  }

  @apiConfig({ requireLogin: true })
  async check({
    guess,
    league_slug,
    wordle_answer_id,
    _user,
  }: {
    guess: string;
    league_slug: string;
    wordle_answer_id: number;
    _user: User;
  }) {
    const league = await checkLeague(league_slug, _user);

    const abDate = new Date();
    const answer = await queries.answer({ league_slug, wordle_answer_id, active_between: abDate });
    if (!answer) {
      throw new HttpNotFound('Puzzle not found');
    }

    if (!guess) {
      throw new HttpBadRequest('must pass field named "guess" containing guessed word');
    }
    if (guess.length !== league.letters) {
      throw new HttpBadRequest(`guess must be ${league.letters} letters`);
    }

    const guessesList = await queries.getGuesses({
      user_id: _user.user_id,
      wordle_answer_id: answer.wordle_answer_id,
      sort: 'wordle_guesses.create_date',
    });
    if (guessesList.find(g => g.correct)) {
      throw new HttpBadRequest('Already have a correct answer');
    }

    if (guessesList.find(g => g.guess === guess)) {
      throw new HttpBadRequest('Already made this guess');
    }

    const guesses = guessesList.map(g => g.guess);

    if (guesses.length >= league.max_guesses) {
      throw new HttpBadRequest('Already reached maximum number of quesses for this puzzle');
    }

    if (!utils.isWordInList(guess, league.accept_word_list || utils.defaultAnswerWordList)) {
      throw new HttpBadRequest('Invalid word');
    }

    guesses.push(guess);
    const result = utils.evaluateGuess(answer.answer, guess);

    if (league.is_hard_mode) {
      if (!utils.checkHardMode(league, guess, result, guessesList, answer)) {
        throw new HttpBadRequest('Invalid guess - violates prior rules');
      }
    }

    await queries.addGuess({
      user_id: _user.user_id,
      wordle_answer_id: answer.wordle_answer_id,
      guess,
      correct_placement: result.reduce((c, n) => (c + n === '+' ? 1 : 0), 0),
      correct_letters: result.reduce((c, n) => (c + n === ' ' ? 0 : 1), 0),
      correct: guess === answer.answer,
      completed: guess === answer.answer || guesses.length >= league.max_guesses,
    });

    return {
      guesses: guesses.map((g: string) => ({
        guess: g,
        result: utils.evaluateGuess(answer.answer, g),
        reduction: [-1, -1],
      })),
      correct: guess === answer.answer,
      completed: guess === answer.answer || guesses.length === league.max_guesses,
      answer: guesses.length === league.max_guesses ? answer.answer : null,
    };
  }

  @apiConfig({ requireLogin: true })
  async guesses({
    user_id,
    league_slug,
    wordle_answer_id,
    reduce,
    _user,
  }: {
    user_id: number;
    league_slug: string;
    wordle_answer_id: number;
    reduce: boolean;
    _user: User;
  }) {
    const league = await checkLeague(league_slug, _user);

    const answer = await queries.answer({ league_slug, wordle_answer_id });
    if (!answer) {
      throw new HttpNotFound('Puzzle not found');
    }

    if (user_id) {
      const ourStatus = await queries.wordleStatuses({ wordle_answer_id, completed: true, user_id: _user.user_id });
      if (!ourStatus.length) {
        throw new HttpBadRequest('You have not completed this puzzle', 'not_completed');
      }
    }

    const effectiveUserId = user_id || _user.user_id;

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

    return {
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
    };
  }

  async comments({ wordle_answer_id, _user }: { wordle_answer_id: number; _user: User }) {
    if (!wordle_answer_id) {
      throw new HttpNotFound('Must pass in wordle_answer_id');
    }

    const league = await queries.getLeague({ wordle_answer_id, user_id: _user ? _user.user_id : null });
    if (!league) {
      throw new HttpNotFound('League not found');
    }

    return queries.getComments({ wordle_answer_id, sort: 'create_date' });
  }

  @apiConfig({ requireLogin: true })
  async add_comment({ wordle_answer_id, comment, _user }: { wordle_answer_id: number; comment: string; _user: User }) {
    if (!wordle_answer_id) {
      throw new HttpNotFound('Must pass in wordle_answer_id');
    }

    const league = await queries.getLeague({ wordle_answer_id, user_id: _user ? _user.user_id : null });
    if (!league) {
      throw new HttpNotFound('League not found');
    }

    await queries.addComment({
      wordle_answer_id,
      comment,
      user_id: _user.user_id,
    });

    await queries.sleep(50);

    return { status: 'ok' };
  }

  @apiConfig({ requireLogin: true })
  async completed({ league_slug, wordle_answer_id, _user }: { league_slug: string; wordle_answer_id: number; _user: User }) {
    await checkLeague(league_slug, _user);
    const answer = await queries.answer({ league_slug, wordle_answer_id });
    if (!answer) {
      throw new HttpNotFound('Puzzle not found');
    }

    const ourStatus = await queries.wordleStatuses({ wordle_answer_id, user_id: _user.user_id, completed: true });
    if (!ourStatus.length) {
      throw new HttpBadRequest('You have not completed this puzzle', 'not_completed');
    }

    return queries.wordleStatuses({
      wordle_answer_id,
      completed: true,
      sort: ['correct::char(5) desc', 'num_guesses', 'ws.end_date'],
    });
  }
}
