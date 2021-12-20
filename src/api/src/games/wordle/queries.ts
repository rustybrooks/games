import { SQL } from '../../db';
import * as utils from './utils';

export function roundedNow() {
  const d = new Date();
  d.setMinutes(60 * Math.round(d.getMinutes() / 60));
  return d;
}

/* ******* leagues ******** */
export async function leagues() {
  const query = 'select * from wordle_leagues';
  return SQL.select(query);
}

/* ******* series ******** */
export async function leagueSeries({
  wordle_league_id = null,
  end_date_before = null,
  page = null,
  limit = null,
  sort = null,
}: {
  wordle_league_id?: number;
  end_date_before?: Date;
  page?: number;
  limit?: number;
  sort?: string[] | string;
} = {}) {
  const [where, bindvars] = SQL.autoWhere({ wordle_league_id });

  if (end_date_before) {
    where.push('end_date <= $1');
    bindvars.push(end_date_before);
  }

  return SQL.select(
    `
        select *
        from wordle_league_series
        ${SQL.whereClause(where)}
        ${SQL.orderBy(sort)}
        ${SQL.limit(page, limit)}
    `,
    bindvars,
  );
}

export async function addLeagueSeries(data: { [id: string]: any }) {
  return SQL.insert('wordle_league_series', data, 200, false, true);
}

export async function generateSeries(league: any, now: Date) {
  console.log('league', league);
  const lastSeries = await leagueSeries({
    wordle_league_id: league.wordle_league_id,
    page: 1,
    limit: 1,
    sort: '-start_date',
  });
  console.log('last series', lastSeries);

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
export async function generateAnswer(league: any) {
  const now = roundedNow();
  const end = roundedNow();
  end.setHours(end.getHours + league.time_to_live_hours);
  const series = await leagueSeries({
    wordle_league_id: league.wordle_league_id,
    end_date_before: now,
    page: 1,
    limit: 1,
    sort: '-start_date',
  });
  SQL.insert('answers', {
    wordle_league_series_id: series.wordle_league_series_id,
    answer: utils.randomWord(league.letters),
    active_after: now,
    active_before: now,
  });
}
