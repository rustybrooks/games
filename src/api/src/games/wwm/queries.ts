import { SQL } from '../../db';
import { ActivePuzzle, Guess, League, WWMStatus, QueryParams } from '../../../../ui/types';
import { defaultSourceWordList, randomWord } from './utils';

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export function roundedNow() {
  const d = new Date();
  d.setMinutes(60 * Math.round(d.getMinutes() / 60));
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

/* ******* leagues ******** */

export async function addLeague(data: any) {
  return SQL.insert('wordle_leagues', data);
}

export async function getLeagues({
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
} & QueryParams = {}): Promise<League[]> {
  const [where, bindvars] = SQL.autoWhere({ wordle_league_id, league_slug });

  const joins = [];
  const extraCols = [];
  if (user_id) {
    bindvars.user_id = user_id;
    where.push('(not is_private or (user_id is not null) or create_user_id=$(user_id))');
    extraCols.push('case when wlm.user_id is null and create_user_id != $(user_id) then false else true end as is_member');
    joins.push(
      `left join wordle_league_members wlm on (wlm.wordle_league_id=wl.wordle_league_id and wlm.user_id=$(user_id) and wlm.active)`,
    );
  } else if (isMemberOnly) {
    where.push('not is_private');
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
  // console.log(query, bindvars);
  return SQL.select(query, bindvars);
}

export async function getLeague(args: any) {
  const l = await getLeagues(args);
  if (l.length > 1) {
    throw new Error(`Expected only one league entry, found ${l.length}`);
  }
  return l.length ? l[0] : null;
}

export async function getLeagueSeriesStats({
  league_slug,
  wordle_league_series_id,
  page = null,
  limit = null,
  sort = null,
}: {
  league_slug: string;
  wordle_league_series_id: number;
} & QueryParams) {
  const [where, bindvars] = SQL.autoWhere({ league_slug, wordle_league_series_id });

  const possible = 'sum(case when a.active_after < now() then 1 else 0 end)';
  const wins = 'sum(case when correct then 1 else 0 end)';
  const done = 'sum(case when not completed or wordle_status_id is null then 0 else 1 end)';
  const raw_score = 'sum(case when correct then 1+l.max_guesses-num_guesses else 0 end)';

  const query = `
      select
      user_id::integer, username, s.start_date, s.end_date, 
      ${raw_score}::integer as raw_score,
      ${raw_score}::float/nullif(${possible}, 0) as score,
      avg(num_guesses)::float as avg_guesses,
      avg(case when correct then num_guesses else null end)::float as avg_guesses_correct,
      max(num_guesses)::integer as max_guesses,
      min(case when correct then num_guesses else null end)::integer as min_guesses_correct,
      ${done}::integer as done,
      ${wins}::integer as wins,
      ${wins}::float/nullif(${done}, 0) as win_pct,
      ${wins}::float/nullif(${possible}, 0) as win_pct_possible,
      ${possible}::integer as possible      
      from wordle_leagues l
      join wordle_league_series s using(wordle_league_id)
      join wordle_league_members m using (wordle_league_id)
      join users u using (user_id)
      join wordle_answers a using (wordle_league_series_id)
      left join wordle_status ws using (wordle_answer_id, user_id)
      ${SQL.whereClause(where)}
      group by 1, 2, 3, 4
      having ${done} > 0
      ${SQL.orderBy(sort)}
      ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
}

/* ******* series ******** */
export async function getleagueSeries({
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

export async function generateSeries(league: League, now: Date) {
  const lastSeries = await getleagueSeries({
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
    console.log('Add league series', league.league_slug, now, start, end);
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
  console.log(new Date(), 'generateAllSeries');
  for (const l of await getLeagues()) {
    await generateSeries(l, now);
  }
}

/* ******* answers ******** */

export async function getAnswers({
  wordle_league_id = null,
  wordle_answer_id = null,
  league_slug = null,
  active_after = null,
  active_between = null,
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_league_id?: number;
  wordle_answer_id?: number;
  league_slug?: string;
  active_after?: Date;
  active_between?: Date;
  page?: number;
  limit?: number;
  sort?: string | string[];
} = {}) {
  const [where, bindvars] = SQL.autoWhere({
    wordle_league_id,
    wordle_answer_id,
    league_slug,
    active_after,
  });

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
  // console.log(query, bindvars);
  return SQL.select(query, bindvars);
}

export async function answer(args: any) {
  const l = await getAnswers(args);
  if (l.length > 1) {
    throw new Error(`Expected only one answer entry, found ${l.length}`);
  }
  return l.length ? l[0] : null;
}

export async function generateAnswer(league: any, activeAfter: Date) {
  const activeBefore = new Date(activeAfter);
  activeBefore.setHours(activeBefore.getHours() + league.time_to_live_hours);
  const series = await getleagueSeries({
    wordle_league_id: league.wordle_league_id,
    start_date_before: activeAfter,
    end_date_after: activeAfter,
    page: 1,
    limit: 1,
    sort: '-start_date',
  });
  if (!series.length) {
    // console.log('No series for league, not creating answer', league);
    return null;
  }

  const a = await getAnswers({
    wordle_league_id: league.wordle_league_id,
    active_after: activeAfter,
    page: 1,
    limit: 1,
  });
  if (a.length) return a[0];

  const rando = randomWord(league.letters, league.source_word_list || defaultSourceWordList).toLowerCase();
  console.log('Adding', activeAfter, activeBefore, rando);
  return SQL.insert(
    'wordle_answers',
    {
      wordle_league_series_id: series[0].wordle_league_series_id,
      answer: rando,
      create_date: new Date(),
      active_after: activeAfter,
      active_before: activeBefore,
    },
    '*',
  );
}

export async function generateAnswers(league: League, now: Date) {
  const lastAnswer = await getAnswers({
    wordle_league_id: league.wordle_league_id,
    page: 1,
    limit: 1,
    sort: '-active_after',
  });

  let start = league.start_date;
  if (lastAnswer.length) {
    start = lastAnswer[0].active_after;
    start.setMinutes(start.getMinutes() + league.answer_interval_minutes);
  }

  const startCutoff = new Date(now);
  startCutoff.setDate(startCutoff.getDate() + 7);
  while (start < startCutoff) {
    await generateAnswer(league, start);
    start.setMinutes(start.getMinutes() + league.answer_interval_minutes);
  }
}

export async function generateAllAnswers(now: Date) {
  console.log(new Date(), 'generateAllAnswers');
  for (const l of await getLeagues()) {
    await generateAnswers(l, now);
  }
}

export async function getPuzzles({
  user_id,
  active = null,
  wordle_league_id = null,
  league_slug = null,
  page = null,
  limit = null,
  sort = null,
}: {
  user_id: number;
  active?: boolean;
  wordle_league_id?: number;
  league_slug?: string;
  page?: number;
  limit?: number;
  sort?: string | string[];
}): Promise<ActivePuzzle> {
  const [where, bindvars] = SQL.autoWhere({ wordle_league_id, league_slug });

  if (user_id) {
    where.push('((m.active and m.user_id=$(user_id)) or create_user_id=$(user_id))');
    bindvars.user_id = user_id;
  }

  if (active !== null) {
    if (active) {
      where.push('$(now) between active_after and active_before');
    } else {
      where.push('$(now) > active_before');
    }
    bindvars.now = new Date();
  }

  const query = `
      select league_slug, league_name, 
             a.wordle_answer_id, active_after, active_before, 
             s.start_date as series_start_date, s.end_date as series_end_date,
             ws.num_guesses, ws.correct, ws.completed,
             case 
                 when ws.completed then a.answer 
                 else null 
             end as correct_answer
      from wordle_leagues l
      join wordle_league_series s using (wordle_league_id)
      join wordle_answers a using (wordle_league_series_id)
      left join wordle_league_members m using (wordle_league_id)
      left join wordle_status ws using (user_id, wordle_answer_id)
      ${SQL.whereClause(where)}
      ${SQL.orderBy(sort)}
      ${SQL.limit(page, limit)}
  `;
  console.log(query, bindvars);
  return SQL.select(query, bindvars);
}

/* ******* guesses ******** */

export async function addGuess({
  user_id,
  wordle_answer_id,
  guess,
  correct_placement,
  correct_letters,
  correct,
  completed,
}: {
  user_id: number;
  wordle_answer_id: number;
  guess: string;
  correct_placement: number;
  correct_letters: number;
  correct: boolean;
  completed: boolean;
}) {
  const now = new Date();
  // this needs to be a transaction
  await SQL.insert('wordle_guesses', {
    user_id,
    wordle_answer_id,
    guess: guess.toLowerCase(),
    correct_placement,
    correct_letters,
    correct,
    create_date: now,
  });

  await sleep(25);

  await SQL.insert(
    'wordle_status',
    {
      user_id,
      wordle_answer_id,
      num_guesses: 1,
      correct_placement,
      correct_letters,
      correct,
      start_date: now,
      end_date: now,
      completed,
    },
    null,
    `
       on conflict (user_id, wordle_answer_id) 
       do update set 
       num_guesses=(
         select count(*) 
         from wordle_guesses wg 
         where wg.wordle_answer_id=excluded.wordle_answer_id and wg.user_id=excluded.user_id
       ),
       correct_placement=excluded.correct_placement,
       correct_letters=excluded.correct_letters,
       correct=excluded.correct,
       end_date=excluded.end_date,
       completed=excluded.completed
`,
  );
}

export async function getGuesses({
  wordle_answer_id = null,
  user_id = null,
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_answer_id?: number;
  user_id?: number;
  page?: number;
  limit?: number;
  sort?: string | string[];
} = {}): Promise<Guess[]> {
  const [where, bindvars] = SQL.autoWhere({ wordle_answer_id, user_id });
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
  return SQL.insert(
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
  return SQL.update(
    'wordle_league_members',
    'wordle_league_id=$(wordle_league_id) and user_id=$(user_id)',
    { wordle_league_id, user_id },
    {
      active: false,
      leave_date: new Date(),
    },
  );
}

/* ******* wordle_status ******** */

export async function wordleStatuses({
  wordle_answer_id,
  user_id,
  completed = null,
  page = null,
  limit = null,
  sort = null,
}: { wordle_answer_id: number; user_id?: number; completed?: boolean } & QueryParams): Promise<WWMStatus[]> {
  const [where, bindvars] = SQL.autoWhere({ wordle_answer_id, user_id, completed });
  const query = `
    select username, ws.*
    from wordle_status ws 
    join users u using (user_id)
    ${SQL.whereClause(where)}
    ${SQL.orderBy(sort)}
    ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
}
