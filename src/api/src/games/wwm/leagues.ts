import { apiClass, apiConfig, HttpBadRequest, HttpNotFound } from '@rustybrooks/api-framework';

import { randomBytes } from 'crypto';
import * as utils from './utils';
import * as queries from './queries';
import { League, User } from '../../../../ui/types';
import { checkLeague } from './index';

@apiClass()
export class Leagues {
  async index({ sort = 'league_name', _user = null }: { sort: string; _user: User }) {
    const lg = await queries.getLeagues({ sort, user_id: _user ? _user.user_id : null, isMemberOnly: false });
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
      'is_creator',
    ];
    return lg.map(l => Object.fromEntries(cols.map(c => [c, l[c]])));
  }

  @apiConfig({ requireLogin: true })
  async join({ league_slug, invite_code, _user }: { league_slug: string; invite_code: string; _user: User }) {
    const league = await queries.getLeague({ league_slug });
    if (!league) {
      throw new HttpNotFound('League not found');
    }

    if (league.is_private && invite_code !== league.invite_code) {
      throw new HttpNotFound('League not found');
    }

    await queries.addLeagueMember({ user_id: _user.user_id, wordle_league_id: league.wordle_league_id });

    return league;
  }

  @apiConfig({ requireLogin: true })
  async leave({ league_slug, _user }: { league_slug: string; _user: User }) {
    const league = await queries.getLeague({ league_slug, user_id: _user.user_id });
    if (!league) {
      throw new HttpNotFound('League not found');
    }

    if (league.create_user_id === _user.user_id) {
      throw new HttpNotFound('League owner can not leave league');
    }
    await queries.removeLeagueMember({ user_id: _user.user_id, wordle_league_id: league.wordle_league_id });

    return { details: 'ok' };
  }

  async info({ league_slug, _user }: { league_slug: string; _user: User }) {
    return checkLeague(league_slug, _user, false);
  }

  async series({ league_slug, _user }: { league_slug: string; _user: User }) {
    const league = await checkLeague(league_slug, _user, false);

    return queries.getleagueSeries({
      wordle_league_id: league.wordle_league_id,
      start_date_before: new Date(),
      sort: '-start_date',
    });
  }

  async series_stats({
    league_slug,
    wordle_league_series_id,
    _user,
  }: {
    league_slug: string;
    wordle_league_series_id: number;
    _user: User;
  }) {
    await checkLeague(league_slug, _user, false);
    return queries.getLeagueSeriesStats({ league_slug, wordle_league_series_id, sort: '-score' });
  }

  async check({ league_name }: { league_name: string }) {
    if (!league_name || !league_name.length) {
      throw new HttpNotFound('Must pass in league name');
    }

    const league_slug = utils.nameToSlug(league_name);

    const league = await queries.getLeague({ league_slug });
    if (league) {
      throw new HttpBadRequest('A league with this slug already exists', 'league_name_exists');
    }

    return { status: 'ok', league_slug };
  }

  @apiConfig({ requireLogin: true })
  async add({
    league_name,
    series_days,
    answer_interval_minutes,
    letters,
    max_guesses,
    time_to_live_hours,
    is_private,
    is_hard_mode,
    _user,
  }: {
    league_name: string;
    series_days: number;
    answer_interval_minutes: number;
    letters: number;
    max_guesses: number;
    time_to_live_hours: number;
    is_private: boolean;
    is_hard_mode: boolean;
    _user: User;
  }) {
    if (league_name.length < 5) {
      throw new HttpBadRequest('League names need to be at least 5 letters', 'league_name_too_short');
    }

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
      create_user_id: _user.user_id,
    };

    const l = await queries.addLeague(data);
    queries.addLeagueMember({
      user_id: _user.user_id,
      wordle_league_id: l.wordle_league_id,
    });

    return { status: 'ok', league_slug };
  }
}
