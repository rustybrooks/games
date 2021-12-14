import { sprintf } from 'sprintf-js';

import * as pgexplorer from '@rustybrooks/pgexplorer';

export class MigrationStatement {
  statement: string = null;

  message: string = null;

  ignoreError = false;

  constructor(statement: string, message: string = null, ignoreError = false) {
    this.statement = statement;
    this.message = message;
    this.ignoreError = ignoreError;
  }

  log(logs: string[], msg: string, args: any[]) {
    const formatted = sprintf(msg, ...args);
    if (logs) {
      logs.push(formatted);
    }

    console.log(formatted);
  }

  execute(SQL: pgexplorer.sql.SQLBase, dryRun = false, logs: string[] = null) {
    if (this.message) {
      this.log(logs, '%s', [this.message]);
    }

    try {
      this.log(logs, 'SQL Execute: %s', [this.statement]);
      SQL.execute(this.statement, null, dryRun, false);
    } catch (e) {
      this.log(logs, 'Error while running statment: %r', e);
      if (!this.ignoreError) {
        throw e;
      }
    }
  }
}

export class Migration {
  static registry: { [id: string]: Migration } = {};

  version: number = null;

  message: string = null;

  logs: string[] = null;

  statements: MigrationStatement[] = null;

  constructor(version: number, message: string) {
    Migration.registry[version] = this;
    this.version = version;
    this.message = message;
    this.statements = [];
    this.logs = [];
  }

  log(logs: string[], msg: string, args: any[] = null) {
    const formatted = sprintf(msg, ...(args || []));
    logs.push(formatted);
    console.log(formatted);
  }

  async migrate(SQL: pgexplorer.sql.SQLBase, dryRun = false, initial = false, applyVersions: number[] = null) {
    const logs: string[] = [];

    await SQL.execute(`
        create table if not exists migrations
        (
            migration_id
            serial
            primary
            key,
            migration_datetime
            timestamp,
            version_pre
            int,
            version_post
            int
        )`);

    const res = await SQL.selectOne('select max(versionPost) as version from migrations');
    const { version } = res;
    let todo = Object.keys(Migration.registry)
      .filter(x => x > version)
      .map(x => parseInt(x, 10));
    todo.push(...(applyVersions || []));
    todo = todo.sort();
    this.log(logs, `Version = ${version}, todo = ${todo}, initial=${initial}`);

    const versionPre = version;
    let versionPost = version;

    for (const v of todo) {
      this.log(logs, 'Running migration %d: %s', [v, Migration.registry[v].message]);
      for (const statement of Migration.registry[v].statements) {
        statement.execute(SQL, dryRun, logs);
      }

      if (v > versionPre) {
        versionPost = v;
      }
    }

    if (todo.length && !dryRun) {
      SQL.insert('migrations', {
        migration_datetime: 'datetime.datetime.utcnow()',
        versionPre: version,
        versionPost,
      });
    }

    return logs;
  }

  addStatement(statement: string, ignoreError = false, message: string = null) {
    this.statements.push(new MigrationStatement(statement, message, ignoreError));
  }
}

const initial = new Migration(1, 'initial version');
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
