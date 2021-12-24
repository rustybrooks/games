import { SQL } from '../../db';
import { League } from '../../../../ui/types/wordle';
import * as utils from './utils';

export function roundedNow() {
  const d = new Date();
  d.setMinutes(60 * Math.round(d.getMinutes() / 60));
  return d;
}

/* ******* leagues ******** */
export async function leagues({
  wordle_league_id = null,
  league_slug = null,
  user_id = null,
  isMemberOnly = false,
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_league_id?: number;
  league_slug?: string;
  user_id?: number;
  isMemberOnly?: boolean;
  page?: number;
  limit?: number;
  sort?: string[] | string;
} = {}): Promise<League[]> {
  const [where, bindvars] = SQL.autoWhere({ wordle_league_id, league_slug });

  const joins = [];
  const extraCols = [];
  if (user_id) {
    bindvars.user_id = user_id;
    extraCols.push('case when user_id is null then false else true end as is_member');
    joins.push(
      `${
        isMemberOnly ? '' : 'left '
      }join wordle_league_members wlm on (wlm.wordle_league_id=wl.wordle_league_id and wlm.user_id=$(user_id))`,
    );
  }
  // console.log(extraCols, user_id);
  const query = `
      select wl.*${extraCols.length ? `, ${extraCols.join(', ')}` : ''}
      from wordle_leagues wl
      ${joins.join('\n')}
      ${SQL.whereClause(where)}
      ${SQL.orderBy(sort)}
      ${SQL.limit(page, limit)}
  `;
  console.log(query);
  return SQL.select(query, bindvars);
}

export async function league(args: any) {
  const l = await leagues(args);
  if (l.length > 1) {
    throw new Error(`Expected only one league entry, found ${l.length}`);
  }
  return l.length ? l[0] : null;
}

/* ******* series ******** */
export async function leagueSeries({
  wordle_league_id = null,
  start_date_before = null,
  start_date_after = null,
  end_date_before = null,
  end_date_after = null,
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_league_id?: number;
  start_date_before?: Date;
  start_date_after?: Date;
  end_date_before?: Date;
  end_date_after?: Date;
  page?: number;
  limit?: number;
  sort?: string[] | string;
} = {}) {
  const [where, bindvars] = SQL.autoWhere({ wordle_league_id });

  if (start_date_before) {
    where.push('start_date <= $(start_date_before)');
    bindvars.start_date_before = start_date_before;
  }

  if (start_date_after) {
    where.push('start_date >= $(start_date_after)');
    bindvars.start_date_after = start_date_after;
  }

  if (end_date_before) {
    where.push('end_date < $(end_date_before)');
    bindvars.end_date_before = end_date_before;
  }

  if (end_date_after) {
    where.push('end_date > $(end_date_after)');
    bindvars.end_date_after = end_date_after;
  }

  const query = `
        select *
        from wordle_league_series
        ${SQL.whereClause(where)}
        ${SQL.orderBy(sort)}
        ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
}

export async function addLeagueSeries(data: { [id: string]: any }) {
  return SQL.insert('wordle_league_series', data, 200, false, true);
}

export async function generateSeries(league: any, now: Date) {
  const lastSeries = await leagueSeries({
    wordle_league_id: league.wordle_league_id,
    page: 1,
    limit: 1,
    sort: '-start_date',
  });

  let start = league.start_date;
  if (lastSeries.length) {
    start = lastSeries[0].end_date;
  }

  const startCutoff = new Date(now);
  startCutoff.setDate(startCutoff.getDate() + 7);
  while (start < startCutoff) {
    const end = new Date(start);
    end.setDate(end.getDate() + league.series_days);
    await addLeagueSeries({
      wordle_league_id: league.wordle_league_id,
      create_date: now,
      start_date: start,
      end_date: end,
    });
    start = new Date(end);
  }
}

export async function generateAllSeries(now: Date) {
  for (const l of await leagues()) {
    await generateSeries(l, now);
  }
}

/* ******* answers ******** */
export async function answers({
  wordle_league_id = null,
  league_slug = null,
  active_after = null,
  active_between = null,
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_league_id?: number;
  league_slug?: string;
  active_after?: Date;
  active_between?: Date;
  page?: number;
  limit?: number;
  sort?: string | string[];
} = {}) {
  const [where, bindvars] = SQL.autoWhere({ wordle_league_id, league_slug, active_after });

  if (active_between) {
    where.push('$(active_between) between active_after and active_before');
    bindvars.active_between = active_between;
  }

  const query = `
    select a.* 
    from wordle_answers a
    join wordle_league_series ls using (wordle_league_series_id)
    join wordle_leagues l using (wordle_league_id)
    ${SQL.whereClause(where)}
    ${SQL.orderBy(sort)}
    ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
}

export async function answer(args: any) {
  const l = await answers(args);
  if (l.length > 1) {
    throw new Error(`Expected only one answer entry, found ${l.length}`);
  }
  return l.length ? l[0] : null;
}

export async function generateAnswer(league: any, now: Date) {
  const end = new Date(now);
  end.setHours(end.getHours() + league.time_to_live_hours);
  const series = await leagueSeries({
    wordle_league_id: league.wordle_league_id,
    start_date_before: now,
    end_date_after: now,
    page: 1,
    limit: 1,
    sort: '-start_date',
  });
  if (!series.length) {
    // console.log('No series for league, not creating answer', league);
    return null;
  }

  const a = await answers({
    active_after: now,
    page: 1,
    limit: 1,
  });
  if (a.length) return a[0];

  return SQL.insert(
    'wordle_answers',
    {
      wordle_league_series_id: series[0].wordle_league_series_id,
      answer: utils.randomWord(league.letters),
      create_date: now,
      active_after: now,
      active_before: end,
    },
    '*',
  );
}

/* ******* guesses ******** */

export async function addGuess({
  user_id,
  wordle_answer_id,
  guess,
  correct_placement,
  correct_letters,
  correct,
}: {
  user_id: number;
  wordle_answer_id: number;
  guess: string;
  correct_placement: number;
  correct_letters: number;
  correct: boolean;
}) {
  SQL.insert('wordle_guesses', {
    user_id,
    wordle_answer_id,
    guess,
    correct_placement,
    correct_letters,
    correct,
    create_date: new Date(),
  });
}

export async function guesses({
  wordle_answer_id = null,
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_answer_id?: number;
  page?: number;
  limit?: number;
  sort?: string | string[];
} = {}) {
  const [where, bindvars] = SQL.autoWhere({ wordle_answer_id });
  const query = `
      select *
      from wordle_answers
      join wordle_guesses using (wordle_answer_id)
    ${SQL.whereClause(where)}
    ${SQL.orderBy(sort)}
    ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
}

/* ******* league members ******** */

export async function leagueMembers({
  page = null,
  limit = null,
  sort = null,
}: {
  page?: number;
  limit?: number;
  sort?: string | string[];
} = {}) {
  const [where, bindvars] = SQL.autoWhere({});
  const query = `
      select * 
      from wordle_league_members
    ${SQL.whereClause(where)}
    ${SQL.orderBy(sort)}
    ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
}

export async function addLeagueMember({ user_id, wordle_league_id }: { user_id: number; wordle_league_id: number }) {
  const now = new Date();
  SQL.insert(
    'wordle_league_members',
    {
      user_id,
      wordle_league_id,
      add_date: now,
      rejoin_date: now,
      active: true,
    },
    null,
    `
        on conflict (wordle_league_id, user_id) 
        do update set 
        active=true, 
        rejoin_date=case when wordle_league_members.active then wordle_league_members.rejoin_date else excluded.rejoin_date end`,
  );
}

export async function removeLeagueMember({ user_id, wordle_league_id }: { user_id: number; wordle_league_id: number }) {
  SQL.update(
    'wordle_league_members',
    'wordle_league_id=$(wordle_league_id) and user_id=$(user_id)',
    { wordle_league_id, user_id },
    {
      active: false,
      leave_date: new Date(),
    },
  );
}
