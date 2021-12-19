#!/srv/src/api/node_modules/.bin/ts-node

import * as pgexplorer from '@rustybrooks/pgexplorer';
import { migrations } from '@rustybrooks/pgexplorer';

import * as users from '../src/users/queries';

const initial = new migrations.Migration(1, 'initial version');
['guesses', 'answers', 'league_series', 'league_members', 'leagues', 'users'].forEach(t =>
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
    create table leagues(
        league_id serial primary key,
        league_slug varchar(200) not null,
        league_name varchar(200) not null, 
        created timestamp with time zone not null default now(),
        series_cron_interval varchar(100),
        answer_cron_interval varchar(100),
        letters smallint default 5,
        time_to_live_hours int default 24*60
    )
`);
initial.addStatement('create index leagues_league_name on leagues(league_name)');

initial.addStatement(`
    create table league_series(
        league_series_id serial primary key,
        league_id bigint not null references leagues(league_id),
        start_time timestamp with time zone not null,
        end_time timestamp with time zone not null
    )
`);
initial.addStatement(`
create unique index league_series_u on league_series(league_id, start_time, end_time) 
`);

initial.addStatement(`
    create table league_members(
        league_member_id serial primary key,
        user_id bigint not null references users(user_id),
        league_id bigint not null references leagues(league_id),
        added timestamp with time zone not null default now()
    )
`);

initial.addStatement(`
    create table answers(
        answer_id serial primary key,
        league_series_id bigint not null references league_series(league_series_id),
        answer varchar(10) not null,
        created timestamp with time zone not null default now(),
        active_after timestamp with time zone not null,
        active_before timestamp with time zone
    )
`);

initial.addStatement(`
    create table guesses(
        guess_id serial primary key,
        user_id bigint not null references users(user_id),
        answer_id bigint not null references answers(answer_id),
        guess varchar(10) not null,
        correct_placement smallint not null default 0,
        correct_letters smallint not null default 0,
        correct boolean not null default false,
        created timestamp with time zone not null default now()               
    )
`);

initial.addStatement(`
    insert into leagues(league_name, league_slug, series_cron_interval, answer_cron_interval, letters, time_to_live_hours) 
    values('Daily Play / Weekly Series / 5 letters', 'daily_weekly_5', '0 0 0 * * *', '0 0 0 * * 0', 5, 24)
`);

initial.addStatement(`
    insert into leagues(league_name, league_slug, series_cron_interval, answer_cron_interval, letters, time_to_live_hours) 
    values('Every 6h Play / Weekly Series / 5 letters', 'every_6h_weekly_5', '0 0 0-23/6 * * *', '0 0 0 * * 0', 5, 24)
`);

const bootstrapAdmin = async () => {
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
};

const migrate = async ({ apply, isInitial }: { apply: number[]; isInitial: boolean }) => {
  const SQL = pgexplorer.sql.sqlFactory({ writeUrl: process.env.WRITE_URL });
  console.log('apply', apply, 'initial', isInitial);
  const val = await migrations.Migration.migrate(SQL, isInitial, apply);
  console.log(val);
  await bootstrapAdmin();
};

migrate({ apply: [], isInitial: true }).then(() => process.exit(0));
