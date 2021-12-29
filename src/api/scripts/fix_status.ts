import { SQL } from '../src/db';

async function main() {
  const query = `
    select user_id, wordle_answer_id, 
           max(g.correct_placement) as correct_placement, 
           max(g.correct_letters) as correct_letters,
           max(g.correct::char(5))::boolean as correct,
           max(g.correct::char(5))::boolean or count(*) >= max(l.max_guesses) as completed,
           min(g.create_date) as start_date,
           max(g.create_date) as end_date,
           count(*) as num_guesses,
           max(ws.wordle_status_id) as wordle_status_id
    from wordle_answers a 
    join wordle_guesses g using (wordle_answer_id)
    join wordle_league_series s using (wordle_league_series_id)
    join wordle_leagues l using (wordle_league_id)
    left join wordle_status ws using (user_id, wordle_answer_id)
    group by 1, 2
`;
  const rows = await SQL.select(query);
  console.table(rows);

  for (const row of rows) {
    if (row.wordle_status_id !== null) continue;
    const { wordle_status_id, ...row2 } = row;
    await SQL.insert('wordle_status', row2);
  }
}

main().then(() => process.exit(0));
