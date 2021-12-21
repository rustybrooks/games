import { SQL } from '../../db';
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
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_league_id?: number;
  league_slug?: string;
  page?: number;
  limit?: number;
  sort?: string[] | string;
} = {}) {
  const [where, bindvars] = SQL.autoWhere({ wordle_league_id, league_slug });

  const query = `
      select * 
      from wordle_leagues
      ${SQL.whereClause(where)}
      ${SQL.orderBy(sort)}
      ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
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
  active_after = null,
  page = null,
  limit = null,
  sort = null,
}: { active_after?: Date; page?: number; limit?: number; sort?: string | string[] } = {}) {
  const [where, bindvars] = SQL.autoWhere({ active_after });
  const query = `
    select * 
    from wordle_answers
    ${SQL.whereClause(where)}
    ${SQL.orderBy(sort)}
    ${SQL.limit(page, limit)}
  `;
  return SQL.select(query, bindvars);
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
    return;
  }

  const a = await answers({
    active_after: now,
    page: 1,
    limit: 1,
  });
  if (a.length) return;

  await SQL.insert('wordle_answers', {
    wordle_league_series_id: series[0].wordle_league_series_id,
    answer: utils.randomWord(league.letters),
    active_after: now,
    active_before: end,
  });
}
