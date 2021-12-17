#!/usr/bin/env ts-node

import * as pgexplorer from '@rustybrooks/pgexplorer';
import { migrations } from '@rustybrooks/pgexplorer';

import * as users from '../src/users/queries';

const initial = new migrations.Migration(1, 'initial version');
['users'].forEach(t => initial.addStatement(`drop table if exists ${t}`));

initial.addStatement(`
    create table users(
      user_id serial primary key,
      password varchar(200) not null,
      email varchar(200) not null unique,
      username varchar(50) not null unique,
      is_admin bool default false not null,
      api_key char(64) not null
    )
 `);
initial.addStatement('create index users_username on users(username)');
initial.addStatement('create index users_email on users(email)');
initial.addStatement('create index users_api_key on users(api_key)');

initial.addStatement(`
    create table leagues(
        league_id serial primary key,
        league_name varchar(200),
        created timestamp
    )
`);
initial.addStatement('create index leagues_league_name on leagues(league_name)');

initial.addStatement(`
    create table league_members(
        league_member_id serial primary key,
        user_id bigint references users(user_id),
        league_id bigint references leagues(league_id)
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

const migrate = async ({ apply, initial }: { apply: number[]; initial: boolean }) => {
  const SQL = pgexplorer.sql.sqlFactory({ writeUrl: process.env.WRITE_URL });
  console.log('apply', apply, 'initial', initial);
  const val = await migrations.Migration.migrate(SQL, initial, apply);
  console.log(val);
  await bootstrapAdmin();
};

migrate({ apply: [], initial: false }).then(() => process.exit(0));
