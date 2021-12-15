import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { SQL } from '../db';

export function user({ username = null }: { username?: string }) {
  const where = [];
  const bindvars = [];

  if (username) {
    where.push('username=$1');
    bindvars.push(username);
  }

  return SQL.select_0or1(`select * from users ${SQL.whereClause(where)}`, bindvars);
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
    password: await bcrypt.hash(password, 20),
    email,
    is_admin,
    api_key: api_key || crypto.createHash('sha256').update(Math.random().toString()).digest('hex'),
  };
  return SQL.insert('users', idata);
}

export async function updateUser({ user_id, password }: { user_id: number; password: string }) {
  return SQL.update('users', { user_id, password: bcrypt.hash(password, 20) });
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
  const salt = bcryptedPassword.slice(0, 29);
  const recryptedPassword = await bcrypt.hash(password, salt);
  return recryptedPassword === bcryptedPassword;
}
