import { migrations } from '@rustybrooks/pgexplorer';

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

initial.addStatement('create index users_user_id on users(user_id)');
initial.addStatement('create index users_username on users(username)');
initial.addStatement('create index users_email on users(email)');
initial.addStatement('create index users_api_key on users(api_key)');
