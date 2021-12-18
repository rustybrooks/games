#!/srv/src/api/node_modules/.bin/ts-node

import * as pgexplorer from '@rustybrooks/pgexplorer';
import { migrations } from '@rustybrooks/pgexplorer';

import * as users from '../src/users/queries';

const initial = new migrations.Migration(1, 'initial version');
['guesses', 'answers', 'league_members', 'leagues', 'users'].forEach(t => initial.addStatement(`drop table if exists ${t}`));

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
        league_name varchar(200) not null, 
        created timestamp not null default now(),
        rules json
    )
`);
initial.addStatement('create index leagues_league_name on leagues(league_name)');

initial.addStatement(`
    create table league_members(
        league_member_id serial primary key,
        user_id bigint not null references users(user_id),
        league_id bigint not null references leagues(league_id),
        added timestamp not null default now()
    )
`);

initial.addStatement(`
    create table answers(
        answer_id serial primary key,
        league_id bigint not null references leagues(league_id),
        answer varchar(10) not null,
        created timestamp not null default now(),
        active_after timestamp not null,
        active_before timestamp
    )
`);

initial.addStatement(`
    create table guesses(
        guess_id serial primary key,
        user_id bigint not null references users(user_id),
        answer_id bigint not null references answers(answer_id),
        guess varchar(10) not null,
        correct_placement smallint not null,
        correct_letter smallint not null,
        created timestamp not null default now()               
    )
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
