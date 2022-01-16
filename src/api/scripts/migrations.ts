import { migrations } from '@rustybrooks/pgexplorer';
import { randomBytes } from 'crypto';
import { SQL } from '../src/db';

import * as users from '../src/users/queries';

const initial = new migrations.Migration(1, 'initial version');
['wordle_status', 'wordle_guesses', 'wordle_answers', 'wordle_league_series', 'wordle_league_members', 'wordle_leagues', 'users'].forEach(
  t => initial.addStatement(`drop table if exists ${t}`),
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
        league_slug varchar(200) not null unique,
        league_name varchar(200) not null unique, 
        create_date timestamp with time zone not null,
        start_date timestamp with time zone not null,
        series_days smallint not null,
        answer_interval_minutes int not null,
        letters smallint not null default 5,
        max_guesses smallint not null default 6,
        time_to_live_hours int not null default 24*60,
        is_hard_mode boolean not null default false,
        invite_code char(32) 
    )
`);
initial.addStatement('create index wordle_leagues_league_name on wordle_leagues(league_slug)');

initial.addStatement(`
    create table wordle_league_series(
        wordle_league_series_id serial primary key,
        wordle_league_id bigint not null references wordle_leagues(wordle_league_id),
        create_date timestamp with time zone not null,
        start_date timestamp with time zone not null,
        end_date timestamp with time zone not null
    )
`);
initial.addStatement(`
create unique index wordle_league_series_u on wordle_league_series(wordle_league_id, start_date, end_date) 
`);

initial.addStatement(`
    create table wordle_league_members(
        wordle_league_member_id serial primary key,
        user_id bigint not null references users(user_id),
        wordle_league_id bigint not null references wordle_leagues(wordle_league_id),
        add_date timestamp with time zone not null,
        leave_date timestamp with time zone,
        rejoin_date timestamp with time zone,
        active boolean not null
    )
`);
initial.addStatement('create unique index wordle_league_members_u on wordle_league_members(wordle_league_id, user_id)');

initial.addStatement(`
    create table wordle_answers(
        wordle_answer_id serial primary key,
        wordle_league_series_id bigint not null references wordle_league_series(wordle_league_series_id),
        answer varchar(10) not null,
        create_date timestamp with time zone not null,
        active_after timestamp with time zone not null,
        active_before timestamp with time zone
    )
`);
initial.addStatement(`
create unique index wordle_answers_u on wordle_answers(wordle_league_series_id, active_after)
`);

initial.addStatement(`
    create table wordle_guesses(
        wordle_guess_id serial primary key,
        user_id bigint not null references users(user_id),
        wordle_answer_id bigint not null references wordle_answers(wordle_answer_id),
        guess varchar(10) not null,
        correct_placement smallint not null,
        correct_letters smallint not null,
        correct boolean not null,
        create_date timestamp with time zone not null
    )
`);

// -------------------------------------------------------
let m = new migrations.Migration(2, 'Adding puzzle status');

['wordle_status'].forEach(t => m.addStatement(`drop table if exists ${t}`));

m.addStatement(`
    create table wordle_status(
        wordle_status_id serial primary key,
        user_id bigint not null references users(user_id),
        wordle_answer_id bigint not null references wordle_answers(wordle_answer_id),
        num_guesses smallint not null,
        correct_placement smallint not null,
        correct_letters smallint not null,
        correct boolean not null,
        completed boolean not null,
        start_date timestamp with time zone not null,
        end_date timestamp with time zone 
    )
`);
m.addStatement('create unique index wordle_status_u on wordle_status(user_id, wordle_answer_id)');

// -------------------------------------------------------
m = new migrations.Migration(3, 'Modifying leagues');

m.addStatement(`
    alter table wordle_leagues 
    add column is_private boolean not null default false,
    add column accept_word_list varchar(255),
    add column source_word_list varchar(255)
`);

m.addStatement('create unique index wordle_leagues_invite_code on wordle_leagues(invite_code)');

// -------------------------------------------------------
m = new migrations.Migration(4, 'Modifying leagues');

m.addStatement(`
    alter table wordle_leagues 
    add column create_user_id bigint references users(user_id)
`);

// -------------------------------------------------------
m = new migrations.Migration(5, 'Adding comments');

m.addStatement(`
    create table wordle_comments (
        wordle_comment_id serial primary key,
        user_id bigint not null references users(user_id),
        wordle_answer_id bigint not null references wordle_answers(wordle_answer_id),
        create_date timestamp with time zone not null,
        comment varchar(5000)
    )
`);

export async function bootstrapLeagues(startDate: Date) {
  const user = await users.user({ username: 'rbrooks' });

  for (const d of [
    {
      league_name: 'Daily Play / Weekly Series / 5 letters',
      league_slug: 'daily_weekly_5',
      series_days: 7,
      answer_interval_minutes: 24 * 60,
      letters: 5,
      max_guesses: 6,
      time_to_live_hours: 24,
      start_date: startDate,
      create_date: new Date(),
      create_user_id: user.user_id,
    },

    {
      league_name: 'Daily Play / Weekly Series / 6 letters',
      league_slug: 'daily_weekly_6',
      series_days: 7,
      answer_interval_minutes: 24 * 60,
      letters: 6,
      max_guesses: 7,
      time_to_live_hours: 24,
      start_date: startDate,
      create_date: new Date(),
      create_user_id: user.user_id,
    },

    {
      league_name: 'Daily Play / Weekly Series / 7 letters',
      league_slug: 'daily_weekly_7',
      series_days: 7,
      answer_interval_minutes: 24 * 60,
      letters: 7,
      max_guesses: 7,
      time_to_live_hours: 24,
      start_date: startDate,
      create_date: new Date(),
      create_user_id: user.user_id,
    },

    {
      league_name: 'Every 6h Play / Weekly Series / 5 letters',
      league_slug: 'every_6h_weekly_5',
      series_days: 7,
      answer_interval_minutes: 6 * 60,
      letters: 5,
      max_guesses: 6,
      time_to_live_hours: 24,
      start_date: startDate,
      create_date: new Date(),
      create_user_id: user.user_id,
    },

    {
      league_name: 'Bot League - 5 letters - 5m',
      league_slug: 'bot_league_5l_5m',
      series_days: 7,
      answer_interval_minutes: 15,
      letters: 5,
      max_guesses: 6,
      time_to_live_hours: 24,
      start_date: startDate,
      create_date: new Date(),
      is_private: true,
      invite_code: randomBytes(16).toString('hex'),
      accept_word_list: 'sources/collins.2019.txt.clean',
      source_word_list: 'sources/collins.2019.txt.clean',
      create_user_id: user.user_id,
    },
  ]) {
    await SQL.insert('wordle_leagues', d, false, 'on conflict (league_slug) do nothing');
  }
}

async function bootstrapAdmin() {
  const user = await users.user({ username: 'rbrooks' });
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
  await migrations.Migration.migrate(SQL, isInitial, apply);
}

export async function migrate({ apply = [], isInitial = false }: { apply?: number[]; isInitial?: boolean }) {
  await migrateSimple({ apply, isInitial });

  await bootstrapAdmin();
  await bootstrapLeagues(new Date('2021-12-25'));
}
