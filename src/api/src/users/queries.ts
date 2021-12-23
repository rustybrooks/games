import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { SQL } from '../db';

const saltRounds = 12;

export async function user({ username = null, apiKey = null }: { username?: string; apiKey?: string }) {
  const where = [];
  const bindvars = [];

  if (username) {
    where.push('lower(username)=$1');
    bindvars.push(username.toLowerCase());
  }

  if (apiKey) {
    where.push('lower(api_key)=$1');
    bindvars.push(apiKey.toLowerCase());
  }
  const query = `select * from users ${SQL.whereClause(where)}`;
  // const query = 'select * from users';
  // console.log(query, bindvars, await SQL.select(query, bindvars));
  return SQL.selectZeroOrOne(query, bindvars);
}

export async function addUser({
  username,
  password,
  email,
  is_admin = false,
  api_key = null,
}: {
  username: string;
  password: string;
  email: string;
  is_admin?: boolean;
  api_key?: string;
}) {
  const idata = {
    username,
    password: await bcrypt.hash(password, saltRounds),
    email,
    is_admin,
    api_key: api_key || crypto.createHash('sha256').update(Math.random().toString()).digest('hex'),
  };
  return SQL.insert('users', idata, '*');
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

export function generateToken(username: string) {
  return jwt.sign({ username }, process.env.TOKEN_KEY, {
    expiresIn: '7d',
  });
}
