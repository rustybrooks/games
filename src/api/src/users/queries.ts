import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { SQL } from '../db';

const saltRounds = 12;

export function user({ username = null, apiKey = null }: { username?: string; apiKey?: string }) {
  const where = [];
  const bindvars = [];

  if (username) {
    where.push('username=$1');
    bindvars.push(username);
  }

  if (apiKey) {
    where.push('api_key=$1');
    bindvars.push(apiKey);
  }
  const query = `select * from users ${SQL.whereClause(where)}`;
  return SQL.selectZeroOrOne(query, bindvars);
}

export async function addUser({
  username,
  password,
  email,
  is_admin,
  api_key,
}: {
  username: string;
  password: string;
  email: string;
  is_admin: boolean;
  api_key: string;
}) {
  const idata = {
    username,
    password: await bcrypt.hash(password, saltRounds),
    email,
    is_admin,
    api_key: api_key || crypto.createHash('sha256').update(Math.random().toString()).digest('hex'),
  };
  return SQL.insert('users', idata);
}

export async function updateUser({ user_id, password }: { user_id: number; password: string }) {
  return SQL.update('users', { user_id, password: bcrypt.hash(password, saltRounds) });
}

export async function deleteUser({ username }: { username: string }) {
  const where = [];
  const bindvars = [];

  if (username) {
    where.push('username=$1');
    bindvars.push(username);
  }

  return SQL.delete('users', where, bindvars);
}

export async function checkPassword(password: string, bcryptedPassword: string) {
  return bcrypt.compare(password, bcryptedPassword);
}
