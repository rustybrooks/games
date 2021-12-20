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
  league_id = null,
  end_date_before = null,
  page = null,
  limit = null,
  sort = null,
}: {
  league_id?: number;
  end_date_before: Date;
  page?: number;
  limit?: number;
  sort: string[] | string;
}) {
  const [where, bindvars] = SQL.autoWhere({ league_id });

  if (end_date_before) {
    where.push('end_date <= $1');
    bindvars.push(end_date_before);
  }

  return SQL.selectOne(
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
  return SQL.insert('league_series', data, 200, false, true);
}

export async function generateSeries(league: any) {
  const lastSeries = await leagueSeries({
    league_id: league.league_id,
    page: 1,
    limit: 1,
    sort: '-start_date',
  });

  let start = league.start_date;
  if (lastSeries.length) {
    const daysToEnd = lastSeries.end_date.getTime() - roundedNow().getTime();
    if (daysToEnd <= 1) {
      start = lastSeries.end_date;
    }
  }

  const end = start.copy();
  end.setDate(end.getDate() + league.series_days);
  return addLeagueSeries({
    league_id: league.league_id,
    start_date: start,
    end_date: end,
  });
}

export async function generateAllSeries() {
  (await leagues()).map(async (l: any) => {
    generateSeries(l);
  });
}

/* ******* answers ******** */
export async function generateAnswer(league: any) {
  const now = roundedNow();
  const end = roundedNow();
  end.setHours(end.getHours + league.time_to_live_hours);
  const series = await leagueSeries({
    league_id: league.league_id,
    end_date_before: now,
    page: 1,
    limit: 1,
    sort: '-start_date',
  });
  SQL.insert('answers', {
    league_series_id: series.league_series_id,
    answer: utils.randomWord(league.letters),
    active_after: now,
    active_before: now,
  });
}
