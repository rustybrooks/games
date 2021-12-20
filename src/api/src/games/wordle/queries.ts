import { SQL } from '../../db';
import * as utils from './utils';

export function roundedNow() {
  const d = new Date();
  d.setMinutes(60 * Math.round(d.getMinutes() / 60));
  return d;
}

export async function leagues() {
  const query = 'select * from leagues';
  return SQL.select(query);
}

export async function addLeagueSeries(data: { [id: string]: any }) {
  return SQL.insert('league_series', data, 200, false, true);
}

export async function generateSeries(league: any) {
  const series = await SQL.selectOne(
    `
        select *
        from league_series
        where league_id = $1
        order by start_time desc limit 1`,
    [league.league_id],
  );

  let start = league.start_date;
  if (series.length) {
    const daysToEnd = series.end_time.getTime() - roundedNow().getTime();
    if (daysToEnd <= 1) {
      start = series.end_date;
    }
  }

  const end = start.copy();
  end.setDate(end.getDate() + league.series_days);
  return addLeagueSeries({
    league_id: league.league_id,
    start_time: start,
    end_time: end,
  });
}

export async function generateAllSeries() {
  (await leagues()).map(async (l: any) => {
    generateSeries(l);
  });
}

export async function generateAnswer(league: any) {
  const now = roundedNow();
  const end = roundedNow();
  end.setHours(end.getHours + league.time_to_live_hours);
  const series = await SQL.selectOne(
    `
    select * 
    from league_series 
    where league_id=$1 
    and end_date <= $2
    order by start_time desc 
    limit 1`,
    [league.league_id, now],
  );
  SQL.insert('answers', {
    league_series_id: series.league_series_id,
    answer: utils.randomWord(league.letters),
    active_after: now,
    active_before: now,
  });
}
