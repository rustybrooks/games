import * as pgexplorer from '@rustybrooks/pgexplorer';
import { migrations } from '@rustybrooks/pgexplorer';
import { SQL } from '../src/db';

import * as users from '../src/users/queries';

const initial = new migrations.Migration(1, 'initial version');
['wordle_guesses', 'wordle_answers', 'wordle_league_series', 'wordle_league_members', 'wordle_leagues', 'users'].forEach(t =>
  initial.addStatement(`drop table if exists ${t}`),
);

initial.addStatement(`
    create table users(
      user_id serial primary key,
      password varchar(200) not null,
      email varchar(200) not null unique,
      username varchar(50) not null unique,
      is_admin bool default false not null,
      api_key char(64) not null unique
    )
 `);

initial.addStatement(`
    create table wordle_leagues(
        wordle_league_id serial primary key,
        league_slug varchar(200) not null,
        league_name varchar(200) not null, 
        create_date timestamp with time zone not null default now(),
        start_date timestamp with time zone not null,
        series_days smallint,
        answer_cron_interval varchar(100),
        letters smallint default 5,
        time_to_live_hours int default 24*60
    )
`);
// initial.addStatement('create index wordle_leagues_league_name on wordle_leagues(league_name)');

initial.addStatement(`
    create table wordle_league_series(
        wordle_league_series_id serial primary key,
        wordle_league_id bigint not null references wordle_leagues(wordle_league_id),
        start_time timestamp with time zone not null,
        end_time timestamp with time zone not null
    )
`);
initial.addStatement(`
create unique index wordle_league_series_u on wordle_league_series(wordle_league_id, start_time, end_time) 
`);

initial.addStatement(`
    create table wordle_league_members(
        wordle_league_member_id serial primary key,
        user_id bigint not null references users(user_id),
        wordle_league_id bigint not null references wordle_leagues(wordle_league_id),
        added timestamp with time zone not null default now()
    )
`);

initial.addStatement(`
    create table wordle_answers(
        wordle_answer_id serial primary key,
        wordle_league_series_id bigint not null references wordle_league_series(wordle_league_series_id),
        answer varchar(10) not null,
        create_date timestamp with time zone not null default now(),
        active_after timestamp with time zone not null,
        active_before timestamp with time zone
    )
`);

initial.addStatement(`
    create table wordle_guesses(
        wordle_guess_id serial primary key,
        user_id bigint not null references users(user_id),
        wordle_answer_id bigint not null references wordle_answers(wordle_answer_id),
        guess varchar(10) not null,
        correct_placement smallint not null default 0,
        correct_letters smallint not null default 0,
        correct boolean not null default false,
        create_date timestamp with time zone not null default now()               
    )
`);

export async function bootstrapLeagues() {
  SQL.insert('wordle_leagues', {
    league_name: 'Daily Play / Weekly Series / 5 letters',
    league_slug: 'daily_weekly_5',
    series_days: 7,
    answer_cron_interval: '0 0 0 * * *',
    letters: 5,
    time_to_live_hours: 24,
    start_date: '2021-12-19',
  });

  SQL.insert('wordle_leagues', {
    league_name: 'Every 6h Play / Weekly Series / 5 letters',
    league_slug: 'every_6h_weekly_5',
    series_days: 7,
    answer_cron_interval: '0 0 0-23/6 * * *',
    letters: 5,
    time_to_live_hours: 24,
    start_date: '2021-12-19',
  });
}

async function bootstrapAdmin() {
  const user = await users.user({ username: 'rbrooks' });
  console.log('user', user);
  if (!user) {
    console.log('Adding bootstrapped admin user');
    await users.addUser({
      username: 'rbrooks',
      password: process.env.ADMIN_PASSWORD,
      email: 'me@rustybrooks.com',
      is_admin: true,
      api_key: process.env.ADMIN_API_KEY,
    });
  }
}

export async function migrateSimple({ apply = [], isInitial = false }: { apply?: number[]; isInitial?: boolean }) {
  console.log('apply', apply, 'initial', isInitial);
  // const SQL = pgexplorer.sql.sqlFactory({ writeUrl: process.env.WRITE_URL });
  console.log(await migrations.Migration.migrate(SQL, isInitial, apply));
}

export async function migrate({ apply = [], isInitial = false }: { apply?: number[]; isInitial?: boolean }) {
  await migrateSimple({ apply, isInitial });
  await bootstrapLeagues();
  await bootstrapAdmin();
}
